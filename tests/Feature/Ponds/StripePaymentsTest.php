<?php

use App\Enums\PurchaseStatus;
use App\Enums\RoleEnum;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

const STRIPE_WEBHOOK_SECRET = 'whsec_test';

beforeEach(function () {
    config([
        'payments.driver' => 'stripe',
        'payments.currency' => 'usd',
        'services.stripe.secret' => 'sk_test_fake',
        'services.stripe.webhook_secret' => STRIPE_WEBHOOK_SECRET,
    ]);

    Http::preventStrayRequests();

    $this->member = User::factory()->create();
    $this->member->assignRole(RoleEnum::USER->value);

    $this->pond = Pond::factory()->create(['name' => 'Moon Pond', 'price_cents' => 2500]);
});

function stripePurchase(User $user, Pond $pond, array $attributes = []): PondPurchase
{
    return PondPurchase::factory()->create([
        'user_id' => $user->id,
        'pond_id' => $pond->id,
        'gateway' => 'stripe',
        'gateway_session_id' => 'cs_test_1',
        ...$attributes,
    ]);
}

/**
 * @param  array<string, mixed>  $event
 */
function postStripeWebhook(array $event, ?string $secret = STRIPE_WEBHOOK_SECRET, ?int $timestamp = null)
{
    $payload = json_encode($event);
    $timestamp ??= time();
    $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", (string) $secret);

    return test()->call('POST', route('webhooks.stripe'), [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
        'CONTENT_TYPE' => 'application/json',
    ], $payload);
}

test('checkout creates a Stripe session and sends the member to it', function () {
    Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_test_new', 'url' => 'https://checkout.stripe.com/c/pay/cs_test_new'])]);

    $this->actingAs($this->member)
        ->withHeader('X-Inertia', 'true')
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://checkout.stripe.com/c/pay/cs_test_new');

    $purchase = PondPurchase::sole();

    expect($purchase)
        ->gateway->toBe('stripe')
        ->gateway_session_id->toBe('cs_test_new')
        ->status->toBe(PurchaseStatus::PENDING);

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Bearer sk_test_fake')
        && $request['mode'] === 'payment'
        && $request['line_items'][0]['price_data']['unit_amount'] === 2500
        && $request['line_items'][0]['price_data']['currency'] === 'usd'
        && $request['line_items'][0]['price_data']['product_data']['name'] === 'Moon Pond'
        && $request['client_reference_id'] === $purchase->reference
        && $request['customer_email'] === $this->member->email
        && $request['success_url'] === route('payments.return', $purchase)
        && $request['cancel_url'] === route('payments.cancel', $purchase)
    );
});

test('a Stripe failure is recorded and shown without leaking its details', function () {
    Http::fake(['api.stripe.com/*' => Http::response(['error' => ['message' => 'Invalid API Key sk_test_fake']], 401)]);

    $this->actingAs($this->member)
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertRedirect(route('member.ponds.index'))
        ->assertInertiaFlash('toast.message', 'The payment provider declined this request. Please try again.');

    expect(PondPurchase::sole()->status)->toBe(PurchaseStatus::FAILED);
});

test('checkout says so when Stripe has no key', function () {
    config(['services.stripe.secret' => null]);

    $this->actingAs($this->member)
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertRedirect(route('member.ponds.index'))
        ->assertInertiaFlash('toast.message', 'Online payments are not configured yet.');

    Http::assertNothingSent();
});

test('returning from Stripe asks Stripe whether the payment happened', function () {
    $purchase = stripePurchase($this->member, $this->pond);

    Http::fake(['api.stripe.com/v1/checkout/sessions/cs_test_1' => Http::response(['id' => 'cs_test_1', 'status' => 'complete', 'payment_status' => 'paid', 'payment_intent' => 'pi_1'])]);

    $this->actingAs($this->member)
        ->get(route('payments.return', $purchase))
        ->assertRedirect(route('member.ponds.owned'));

    expect($purchase->fresh())
        ->status->toBe(PurchaseStatus::PAID)
        ->gateway_payment_id->toBe('pi_1');
});

test('visiting the return link without paying does not grant the pond', function () {
    $purchase = stripePurchase($this->member, $this->pond);

    Http::fake(['api.stripe.com/v1/checkout/sessions/cs_test_1' => Http::response(['id' => 'cs_test_1', 'status' => 'open', 'payment_status' => 'unpaid'])]);

    $this->actingAs($this->member)
        ->get(route('payments.return', $purchase))
        ->assertRedirect(route('member.payments.index'));

    expect($purchase->fresh()->isPending())->toBeTrue()
        ->and($this->member->ownsPond($this->pond))->toBeFalse();
});

test('the webhook records a payment even if the buyer never returns', function () {
    $purchase = stripePurchase($this->member, $this->pond);

    postStripeWebhook(['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_test_1', 'payment_status' => 'paid', 'payment_intent' => 'pi_1']]])
        ->assertNoContent();

    expect($purchase->fresh())
        ->status->toBe(PurchaseStatus::PAID)
        ->gateway_payment_id->toBe('pi_1');
});

test('webhook deliveries can repeat without changing the result', function () {
    $purchase = stripePurchase($this->member, $this->pond);
    $event = ['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_test_1', 'payment_status' => 'paid', 'payment_intent' => 'pi_1']]];

    postStripeWebhook($event)->assertNoContent();
    $paidAt = $purchase->fresh()->paid_at;

    $this->travel(5)->minutes();
    postStripeWebhook($event)->assertNoContent();

    expect($purchase->fresh()->paid_at->equalTo($paidAt))->toBeTrue();
});

test('a delayed payment method only counts once the money arrives', function () {
    $purchase = stripePurchase($this->member, $this->pond);

    postStripeWebhook(['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_test_1', 'payment_status' => 'unpaid']]])->assertNoContent();
    expect($purchase->fresh()->isPending())->toBeTrue();

    postStripeWebhook(['type' => 'checkout.session.async_payment_succeeded', 'data' => ['object' => ['id' => 'cs_test_1', 'payment_intent' => 'pi_1']]])->assertNoContent();
    expect($purchase->fresh()->isPaid())->toBeTrue();
});

test('the webhook records failed and expired checkouts', function (string $type, PurchaseStatus $status) {
    $purchase = stripePurchase($this->member, $this->pond);

    postStripeWebhook(['type' => $type, 'data' => ['object' => ['id' => 'cs_test_1']]])->assertNoContent();

    expect($purchase->fresh()->status)->toBe($status);
})->with([
    ['checkout.session.async_payment_failed', PurchaseStatus::FAILED],
    ['checkout.session.expired', PurchaseStatus::CANCELLED],
]);

test('an expired session never undoes a paid purchase', function () {
    $purchase = stripePurchase($this->member, $this->pond, ['status' => PurchaseStatus::PAID, 'paid_at' => now()]);

    postStripeWebhook(['type' => 'checkout.session.expired', 'data' => ['object' => ['id' => 'cs_test_1']]])->assertNoContent();

    expect($purchase->fresh()->isPaid())->toBeTrue();
});

test('the webhook rejects a bad signature, an old signature and a missing secret', function () {
    $purchase = stripePurchase($this->member, $this->pond);
    $event = ['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_test_1', 'payment_status' => 'paid']]];

    postStripeWebhook($event, secret: 'whsec_wrong')->assertStatus(400);
    postStripeWebhook($event, timestamp: time() - 1000)->assertStatus(400);

    config(['services.stripe.webhook_secret' => null]);
    postStripeWebhook($event, secret: '')->assertStatus(400);

    expect($purchase->fresh()->isPending())->toBeTrue();
});

test('the webhook ignores other events and unknown sessions', function () {
    $purchase = stripePurchase($this->member, $this->pond);

    postStripeWebhook(['type' => 'customer.created', 'data' => ['object' => ['id' => 'cus_1']]])->assertNoContent();
    postStripeWebhook(['type' => 'checkout.session.completed', 'data' => ['object' => ['id' => 'cs_other', 'payment_status' => 'paid']]])->assertNoContent();

    expect($purchase->fresh()->isPending())->toBeTrue();
});

test('a full refund made in the Stripe dashboard takes the pond back, a partial one does not', function () {
    $purchase = stripePurchase($this->member, $this->pond, ['status' => PurchaseStatus::PAID, 'paid_at' => now(), 'gateway_payment_id' => 'pi_1']);

    postStripeWebhook(['type' => 'charge.refunded', 'data' => ['object' => ['payment_intent' => 'pi_1', 'refunded' => false]]])->assertNoContent();
    expect($purchase->fresh()->isPaid())->toBeTrue();

    postStripeWebhook(['type' => 'charge.refunded', 'data' => ['object' => ['payment_intent' => 'pi_1', 'refunded' => true]]])->assertNoContent();
    expect($purchase->fresh()->status)->toBe(PurchaseStatus::REFUNDED)
        ->and($this->member->ownsPond($this->pond))->toBeFalse();
});

test('an admin can refund a paid purchase through Stripe', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $purchase = stripePurchase($this->member, $this->pond, ['status' => PurchaseStatus::PAID, 'paid_at' => now(), 'gateway_payment_id' => 'pi_1']);

    Http::fake(['api.stripe.com/v1/refunds' => Http::response(['id' => 're_1', 'status' => 'succeeded'])]);

    $this->actingAs($admin)
        ->post(route('admin.payments.refund', $purchase))
        ->assertRedirect();

    expect($purchase->fresh())
        ->status->toBe(PurchaseStatus::REFUNDED)
        ->refunded_at->not->toBeNull();

    Http::assertSent(fn (Request $request): bool => $request['payment_intent'] === 'pi_1');
});

test('a failed refund leaves the purchase paid', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $purchase = stripePurchase($this->member, $this->pond, ['status' => PurchaseStatus::PAID, 'paid_at' => now(), 'gateway_payment_id' => 'pi_1']);

    Http::fake(['api.stripe.com/v1/refunds' => Http::response(['error' => ['message' => 'nope']], 400)]);

    $this->actingAs($admin)->post(route('admin.payments.refund', $purchase))->assertRedirect();

    expect($purchase->fresh()->isPaid())->toBeTrue();
});

test('only a paid purchase can be refunded, and only by an admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $pending = stripePurchase($this->member, $this->pond);

    $this->actingAs($admin)->post(route('admin.payments.refund', $pending))->assertRedirect();
    $this->actingAs($this->member)->post(route('admin.payments.refund', $pending))->assertForbidden();

    expect($pending->fresh()->isPending())->toBeTrue();
    Http::assertNothingSent();
});

test('an admin can search and filter every payment', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $paid = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id, 'pond_id' => $this->pond->id]);
    $otherPond = Pond::factory()->create();
    PondPurchase::factory()->create(['pond_id' => $otherPond->id]);

    $this->actingAs($admin)
        ->get(route('admin.payments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/admin/payments')
            ->has('payments.data', 2)
            ->where('totals.paid_cents', 2500)
            ->where('totals.pending', 1)
        );

    $this->actingAs($admin)
        ->get(route('admin.payments.index', ['status' => 'paid']))
        ->assertInertia(fn (Assert $page) => $page->has('payments.data', 1)->where('payments.data.0.reference', $paid->reference));

    $this->actingAs($admin)
        ->get(route('admin.payments.index', ['pond' => $otherPond->id]))
        ->assertInertia(fn (Assert $page) => $page->has('payments.data', 1)->where('payments.data.0.pond_name', $otherPond->name));

    $this->actingAs($admin)
        ->get(route('admin.payments.index', ['search' => $this->member->email]))
        ->assertInertia(fn (Assert $page) => $page->has('payments.data', 1)->where('payments.data.0.reference', $paid->reference));
});
