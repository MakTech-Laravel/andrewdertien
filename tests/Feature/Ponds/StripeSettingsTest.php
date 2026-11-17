<?php

use App\Enums\RoleEnum;
use App\Models\PaymentSetting;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use App\Support\Payments\PaymentGatewayManager;
use App\Support\Payments\StripeSettings;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config([
        'payments.driver' => 'sandbox',
        'payments.currency' => 'usd',
        'services.stripe.secret' => null,
        'services.stripe.webhook_secret' => null,
    ]);

    Http::preventStrayRequests();

    $this->admin = User::factory()->create();
    $this->admin->assignRole(RoleEnum::ADMIN->value);

    $this->member = User::factory()->create();
    $this->member->assignRole(RoleEnum::USER->value);
});

/**
 * Forget what the settings service already read, after changing the saved keys.
 */
function refreshStripeSettings(): void
{
    app(StripeSettings::class)->flush();
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function stripeInput(array $overrides = []): array
{
    return [
        'stripe_enabled' => '1',
        'stripe_publishable_key' => 'pk_test_abc123',
        'stripe_secret_key' => 'sk_test_abc123',
        'stripe_webhook_secret' => 'whsec_abc123',
        ...$overrides,
    ];
}

// ── Reading the keys ────────────────────────────────────────────────────────

test('the mode is read from the secret key, never entered by hand', function (?string $key, ?string $mode) {
    expect(StripeSettings::modeOf($key))->toBe($mode);
})->with([
    'test secret' => ['sk_test_abc', 'test'],
    'live secret' => ['sk_live_abc', 'live'],
    'restricted test key' => ['rk_test_abc', 'test'],
    'test publishable' => ['pk_test_abc', 'test'],
    'live publishable' => ['pk_live_abc', 'live'],
    'unrecognised' => ['not-a-key', null],
    'missing' => [null, null],
]);

test('keys are masked for display', function () {
    expect(StripeSettings::mask('sk_test_abcdefghij1234'))->toBe('sk_test_••••••••1234')
        ->and(StripeSettings::mask('whsec_abcdefghij1234'))->toBe('whsec_••••••••1234')
        ->and(StripeSettings::mask(null))->toBeNull()
        ->and(StripeSettings::mask(''))->toBeNull();
});

test('keys saved in the dashboard win over the environment', function () {
    config(['services.stripe.secret' => 'sk_live_fromenv', 'services.stripe.webhook_secret' => 'whsec_fromenv']);
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();

    $settings = app(StripeSettings::class);

    expect($settings->usesDatabaseKeys())->toBeTrue()
        ->and($settings->secretKey())->toBe('sk_test_abc123')
        ->and($settings->webhookSecret())->toBe('whsec_abc123')
        ->and($settings->mode())->toBe('test');
});

test('the environment keys keep working when nothing is saved', function () {
    config(['payments.driver' => 'stripe', 'services.stripe.secret' => 'sk_live_fromenv', 'services.stripe.webhook_secret' => 'whsec_fromenv']);

    $settings = app(StripeSettings::class);

    expect($settings->usesDatabaseKeys())->toBeFalse()
        ->and($settings->isEnabled())->toBeTrue()
        ->and($settings->secretKey())->toBe('sk_live_fromenv')
        ->and($settings->mode())->toBe('live')
        ->and(app(PaymentGatewayManager::class)->mode())->toBe('live');
});

test('secrets are encrypted in the database', function () {
    PaymentSetting::factory()->stripeTest()->create();

    $raw = DB::table('payment_settings')->first();

    expect($raw->stripe_secret_key)->not->toContain('sk_test_abc123')
        ->and($raw->stripe_webhook_secret)->not->toContain('whsec_abc123')
        ->and(PaymentSetting::query()->first()->stripe_secret_key)->toBe('sk_test_abc123');
});

// ── Which payments are taken, and in what mode ──────────────────────────────

test('without Stripe the site runs in sandbox, which counts as test mode', function () {
    $gateways = app(PaymentGatewayManager::class);

    expect($gateways->driver())->toBe('sandbox')
        ->and($gateways->mode())->toBe('sandbox')
        ->and($gateways->isTestMode())->toBeTrue()
        ->and($gateways->isReady())->toBeTrue();
});

test('Stripe test keys turn on Stripe in test mode', function () {
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();

    $gateways = app(PaymentGatewayManager::class);

    expect($gateways->driver())->toBe('stripe')
        ->and($gateways->mode())->toBe('test')
        ->and($gateways->isTestMode())->toBeTrue()
        ->and($gateways->isReady())->toBeTrue();
});

test('Stripe live keys turn on Stripe in live mode', function () {
    PaymentSetting::factory()->stripeLive()->create();
    refreshStripeSettings();

    $gateways = app(PaymentGatewayManager::class);

    expect($gateways->mode())->toBe('live')
        ->and($gateways->isTestMode())->toBeFalse()
        ->and($gateways->isReady())->toBeTrue();
});

test('Stripe without a webhook secret is not ready to take payments', function () {
    PaymentSetting::factory()->stripeTest()->create(['stripe_webhook_secret' => null]);
    refreshStripeSettings();

    expect(app(PaymentGatewayManager::class)->isReady())->toBeFalse();
});

test('switching Stripe off falls back to the sandbox, except in production', function () {
    PaymentSetting::factory()->stripeTest()->create(['stripe_enabled' => false]);
    refreshStripeSettings();

    expect(app(PaymentGatewayManager::class)->mode())->toBe('sandbox');

    app()->detectEnvironment(fn (): string => 'production');

    expect(app(PaymentGatewayManager::class)->mode())->toBe('unavailable')
        ->and(app(PaymentGatewayManager::class)->isReady())->toBeFalse();
});

// ── Using the saved keys ────────────────────────────────────────────────────

test('checkout uses the saved secret key and marks the purchase as a test', function () {
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();
    Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_test_new', 'url' => 'https://checkout.stripe.com/c/pay/cs_test_new'])]);
    $pond = Pond::factory()->create();

    $this->actingAs($this->member)
        ->withHeader('X-Inertia', 'true')
        ->post(route('member.checkout.store', $pond->slug))
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://checkout.stripe.com/c/pay/cs_test_new');

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Bearer sk_test_abc123'));

    expect(PondPurchase::sole())->is_test->toBeTrue()->gateway->toBe('stripe');
});

test('a live checkout is not marked as a test', function () {
    PaymentSetting::factory()->stripeLive()->create();
    refreshStripeSettings();
    Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_live_new', 'url' => 'https://checkout.stripe.com/c/pay/cs_live_new'])]);

    $this->actingAs($this->member)
        ->withHeader('X-Inertia', 'true')
        ->post(route('member.checkout.store', Pond::factory()->create()->slug))
        ->assertStatus(409);

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Bearer sk_live_abc123'));

    expect(PondPurchase::sole()->is_test)->toBeFalse();
});

test('sandbox purchases are marked as tests too', function () {
    $this->actingAs($this->member)
        ->withHeader('X-Inertia', 'true')
        ->post(route('member.checkout.store', Pond::factory()->create()->slug))
        ->assertStatus(409);

    expect(PondPurchase::sole())->is_test->toBeTrue()->gateway->toBe('sandbox');
});

test('webhooks are verified with the saved signing secret', function () {
    PaymentSetting::factory()->stripeTest()->create(['stripe_webhook_secret' => 'whsec_saved']);
    refreshStripeSettings();

    $send = function (string $secret) {
        $payload = json_encode(['type' => 'ping', 'data' => ['object' => []]]);
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        return $this->call('POST', route('webhooks.stripe'), [], [], [], [
            'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
            'CONTENT_TYPE' => 'application/json',
        ], $payload);
    };

    $send('whsec_other')->assertBadRequest();
    $send('whsec_saved')->assertNoContent();
});

// ── The admin page ──────────────────────────────────────────────────────────

test('only admins can open the payment settings', function () {
    $this->get(route('admin.stripe.edit'))->assertRedirect(route('login'));
    $this->actingAs($this->member)->get(route('admin.stripe.edit'))->assertForbidden();
    $this->actingAs($this->member)->put(route('admin.stripe.update'), stripeInput())->assertForbidden();
    $this->actingAs($this->member)->delete(route('admin.stripe.destroy'))->assertForbidden();
});

test('the settings page shows the mode and never the secrets', function () {
    PaymentSetting::factory()->stripeTest()->create(['stripe_secret_key' => 'sk_test_supersecretvalue1234', 'stripe_webhook_secret' => 'whsec_supersecretvalue5678']);
    refreshStripeSettings();

    $response = $this->actingAs($this->admin)
        ->get(route('admin.stripe.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/admin/payment-settings')
            ->where('stripe.enabled', true)
            ->where('stripe.source', 'dashboard')
            ->where('stripe.mode', 'test')
            ->where('stripe.secret_key_hint', 'sk_test_••••••••1234')
            ->where('stripe.webhook_secret_hint', 'whsec_••••••••5678')
            ->where('gateway.mode', 'test')
            ->where('gateway.is_test_mode', true)
            ->where('webhook.url', route('webhooks.stripe'))
            ->where('canEdit', true));

    expect($response->getContent())->not->toContain('supersecretvalue');
});

test('an empty settings page says nothing is saved', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.stripe.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stripe.source', 'none')
            ->where('stripe.mode', null)
            ->where('stripe.secret_key_hint', null)
            ->where('gateway.mode', 'sandbox'));
});

test('an admin can save Stripe test keys after Stripe accepts them', function () {
    Http::fake(['api.stripe.com/v1/balance' => Http::response(['object' => 'balance', 'livemode' => false])]);

    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.stripe.edit'));

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api.stripe.com/v1/balance' && $request->hasHeader('Authorization', 'Bearer sk_test_abc123'));

    $setting = PaymentSetting::sole();

    expect($setting->stripe_enabled)->toBeTrue()
        ->and($setting->stripe_secret_key)->toBe('sk_test_abc123')
        ->and($setting->stripe_webhook_secret)->toBe('whsec_abc123')
        ->and($setting->stripe_publishable_key)->toBe('pk_test_abc123')
        ->and(app(PaymentGatewayManager::class)->mode())->toBe('test');
});

test('leaving a key field blank keeps the saved key', function () {
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();

    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput([
            'stripe_secret_key' => '',
            'stripe_webhook_secret' => '',
            'stripe_publishable_key' => 'pk_test_newone',
            'stripe_enabled' => '0',
        ]))
        ->assertSessionHasNoErrors();

    Http::assertNothingSent();

    $setting = PaymentSetting::sole();

    expect($setting->stripe_secret_key)->toBe('sk_test_abc123')
        ->and($setting->stripe_webhook_secret)->toBe('whsec_abc123')
        ->and($setting->stripe_publishable_key)->toBe('pk_test_newone')
        ->and($setting->stripe_enabled)->toBeFalse();
});

test('a secret key Stripe rejects is not saved', function () {
    Http::fake(['api.stripe.com/v1/balance' => Http::response(['error' => ['message' => 'Invalid API Key']], 401)]);

    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput())
        ->assertSessionHasErrors('stripe_secret_key');

    expect(PaymentSetting::query()->count())->toBe(0);
});

test('keys must look like Stripe keys', function (string $field, string $value) {
    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput([$field => $value]))
        ->assertSessionHasErrors($field);

    Http::assertNothingSent();
})->with([
    'secret key' => ['stripe_secret_key', 'pk_test_abc123'],
    'secret without prefix' => ['stripe_secret_key', 'abc123'],
    'publishable key' => ['stripe_publishable_key', 'sk_test_abc123'],
    'webhook secret' => ['stripe_webhook_secret', 'abc123'],
]);

test('Stripe cannot be switched on without its keys', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput(['stripe_secret_key' => '', 'stripe_webhook_secret' => '']))
        ->assertSessionHasErrors(['stripe_secret_key', 'stripe_webhook_secret']);

    expect(PaymentSetting::query()->count())->toBe(0);
});

test('test and live keys cannot be mixed', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.stripe.update'), stripeInput(['stripe_publishable_key' => 'pk_live_abc123']))
        ->assertSessionHasErrors('stripe_publishable_key');

    Http::assertNothingSent();
});

test('an admin can check the saved connection', function () {
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();
    Http::fake(['api.stripe.com/v1/balance' => Http::response(['livemode' => false])]);

    $this->actingAs($this->admin)
        ->post(route('admin.stripe.test'))
        ->assertRedirect(route('admin.stripe.edit'));

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Bearer sk_test_abc123'));
});

test('checking the connection without a key sends nothing to Stripe', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.stripe.test'))
        ->assertRedirect(route('admin.stripe.edit'));

    Http::assertNothingSent();
});

test('an admin can remove the saved keys', function () {
    PaymentSetting::factory()->stripeLive()->create();
    refreshStripeSettings();

    $this->actingAs($this->admin)
        ->delete(route('admin.stripe.destroy'))
        ->assertRedirect(route('admin.stripe.edit'));

    $setting = PaymentSetting::sole();

    expect($setting->stripe_secret_key)->toBeNull()
        ->and($setting->stripe_webhook_secret)->toBeNull()
        ->and($setting->stripe_enabled)->toBeFalse()
        ->and(app(PaymentGatewayManager::class)->mode())->toBe('sandbox');
});

// ── Showing the mode ────────────────────────────────────────────────────────

test('signed-in pages are told when payments are in test mode', function (string $keys, string $mode, bool $isTest) {
    if ($keys !== 'none') {
        PaymentSetting::factory()->{$keys}()->create();
        refreshStripeSettings();
    }

    $this->actingAs($this->member)
        ->get(route('member.ponds.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('payments.mode', $mode)
            ->where('payments.is_test_mode', $isTest));
})->with([
    'sandbox' => ['none', 'sandbox', true],
    'stripe test keys' => ['stripeTest', 'test', true],
    'stripe live keys' => ['stripeLive', 'live', false],
]);

test('guests are not told the payment mode', function () {
    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->where('payments', null));
});

test('the admin overview reports the Stripe mode', function () {
    PaymentSetting::factory()->stripeTest()->create();
    refreshStripeSettings();

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('gateway.mode', 'test')
            ->where('gateway.is_test_mode', true)
            ->where('gateway.is_ready', true));
});

test('payment rows say whether they were made in test mode', function () {
    PondPurchase::factory()->create(['is_test' => true]);

    $this->actingAs($this->admin)
        ->get(route('admin.payments.index'))
        ->assertInertia(fn (Assert $page) => $page->where('payments.data.0.is_test', true));
});
