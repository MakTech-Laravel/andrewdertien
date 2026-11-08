<?php

use App\Enums\PurchaseStatus;
use App\Enums\RoleEnum;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['payments.driver' => 'sandbox', 'payments.currency' => 'usd']);

    $this->member = User::factory()->create();
    $this->member->assignRole(RoleEnum::USER->value);

    $this->pond = Pond::factory()->create(['price_cents' => 2500]);
});

test('a member can buy a pond end to end', function () {
    $this->actingAs($this->member)
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertRedirect();

    $purchase = PondPurchase::sole();

    expect($purchase)
        ->status->toBe(PurchaseStatus::PENDING)
        ->user_id->toBe($this->member->id)
        ->amount_cents->toBe(2500)
        ->buyer_email->toBe($this->member->email)
        ->pond_name->toBe($this->pond->name);

    $this->actingAs($this->member)
        ->get(route('payments.sandbox.show', $purchase))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pond/member/sandbox-checkout'));

    $this->actingAs($this->member)
        ->post(route('payments.sandbox.complete', $purchase), ['outcome' => 'pay'])
        ->assertRedirect(route('payments.return', $purchase));

    $this->actingAs($this->member)
        ->get(route('payments.return', $purchase))
        ->assertRedirect(route('member.ponds.owned'));

    expect($purchase->fresh()->isPaid())->toBeTrue()
        ->and($purchase->fresh()->paid_at)->not->toBeNull()
        ->and($this->member->ownsPond($this->pond))->toBeTrue();
});

test('a declined payment leaves the pond unowned and is in the history', function () {
    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));
    $purchase = PondPurchase::sole();

    $this->actingAs($this->member)
        ->post(route('payments.sandbox.complete', $purchase), ['outcome' => 'decline'])
        ->assertRedirect(route('member.payments.index'));

    expect($purchase->fresh()->status)->toBe(PurchaseStatus::FAILED)
        ->and($this->member->ownsPond($this->pond))->toBeFalse();

    $this->actingAs($this->member)
        ->get(route('member.payments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/member/payments')
            ->has('payments.data', 1)
            ->where('payments.data.0.status', 'failed')
            ->where('totalPaidCents', 0)
        );
});

test('cancelling at checkout does not charge or own anything', function () {
    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));
    $purchase = PondPurchase::sole();

    $this->actingAs($this->member)
        ->get(route('payments.cancel', $purchase))
        ->assertRedirect(route('member.ponds.index'));

    expect($purchase->fresh()->status)->toBe(PurchaseStatus::CANCELLED)
        ->and($this->member->ownsPond($this->pond))->toBeFalse();
});

test('a member cannot buy a pond twice', function () {
    PondPurchase::factory()->paid()->create(['user_id' => $this->member->id, 'pond_id' => $this->pond->id]);

    $this->actingAs($this->member)
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertRedirect(route('member.ponds.index'));

    expect(PondPurchase::count())->toBe(1);
});

test('starting checkout again closes the abandoned one', function () {
    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));
    $abandoned = PondPurchase::sole();

    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));

    expect($abandoned->fresh()->status)->toBe(PurchaseStatus::CANCELLED)
        ->and(PondPurchase::where('status', PurchaseStatus::PENDING)->count())->toBe(1);
});

test('a price change does not alter a past purchase', function () {
    $purchase = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id, 'pond_id' => $this->pond->id]);

    $this->pond->update(['price_cents' => 9900, 'name' => 'Renamed']);

    expect($purchase->fresh())
        ->amount_cents->toBe(2500)
        ->pond_name->not->toBe('Renamed');
});

test('a draft pond cannot be bought', function () {
    $draft = Pond::factory()->draft()->create();

    $this->actingAs($this->member)
        ->post(route('member.checkout.store', $draft->slug))
        ->assertNotFound();

    expect(PondPurchase::count())->toBe(0);
});

test('guests must log in and admins cannot buy', function () {
    $this->post(route('member.checkout.store', $this->pond->slug))->assertRedirect(route('login'));

    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($admin)
        ->post(route('member.checkout.store', $this->pond->slug))
        ->assertForbidden();
});

test('a member cannot touch or see another member\'s purchase', function () {
    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));
    $purchase = PondPurchase::sole();

    $stranger = User::factory()->create();
    $stranger->assignRole(RoleEnum::USER->value);

    $this->actingAs($stranger)->get(route('payments.sandbox.show', $purchase))->assertForbidden();
    $this->actingAs($stranger)->post(route('payments.sandbox.complete', $purchase), ['outcome' => 'pay'])->assertForbidden();
    $this->actingAs($stranger)->get(route('payments.return', $purchase))->assertForbidden();
    $this->actingAs($stranger)->get(route('payments.cancel', $purchase))->assertForbidden();

    $this->actingAs($stranger)
        ->get(route('member.payments.index'))
        ->assertInertia(fn (Assert $page) => $page->has('payments.data', 0));

    expect($purchase->fresh()->isPending())->toBeTrue();
});

test('the sandbox is refused in production', function () {
    $this->actingAs($this->member)->post(route('member.checkout.store', $this->pond->slug));
    $purchase = PondPurchase::sole();

    app()->detectEnvironment(fn (): string => 'production');
    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($this->member)
        ->post(route('payments.sandbox.complete', $purchase), ['outcome' => 'pay'])
        ->assertNotFound();

    $this->actingAs($this->member)
        ->post(route('member.checkout.store', Pond::factory()->create()->slug))
        ->assertRedirect(route('member.ponds.index'));

    expect($purchase->fresh()->isPending())->toBeTrue()
        ->and(PondPurchase::count())->toBe(1);
});

test('a member dashboard shows their own ponds and spending', function () {
    $purchase = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id, 'pond_id' => $this->pond->id]);
    PondPurchase::factory()->paid()->create();
    Pond::factory()->create();

    $this->actingAs($this->member)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/member/dashboard')
            ->where('stats.owned', 1)
            ->where('stats.spent_cents', 2500)
            ->where('stats.payments', 1)
            ->has('recentPayments', 1)
            ->where('recentPayments.0.reference', $purchase->reference)
            ->missing('suggestedPonds.5')
        );

    $this->actingAs($this->member)
        ->get(route('member.ponds.owned'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/member/my-ponds')
            ->has('purchases', 1)
            ->where('purchases.0.pond.id', $this->pond->id)
        );
});

test('purchase records outlive a deleted account', function () {
    $purchase = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id]);
    $email = $this->member->email;

    $this->member->delete();

    expect($purchase->fresh())
        ->user_id->toBeNull()
        ->buyer_email->toBe($email);
});
