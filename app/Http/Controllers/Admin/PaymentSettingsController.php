<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\UpdateStripeSettingsRequest;
use App\Models\PaymentSetting;
use App\Support\Payments\PaymentGatewayException;
use App\Support\Payments\PaymentGatewayManager;
use App\Support\Payments\StripeGateway;
use App\Support\Payments\StripeSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where an admin connects the site to Stripe: the keys, whether Stripe is on,
 * and a check that the keys work. Secrets are never sent back to the browser.
 */
class PaymentSettingsController extends Controller
{
    /**
     * The Stripe events the webhook needs, in the order they appear in Stripe's dashboard.
     *
     * @var list<string>
     */
    private const WEBHOOK_EVENTS = [
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed',
        'checkout.session.expired',
        'charge.refunded',
    ];

    public function edit(Request $request, StripeSettings $stripe, PaymentGatewayManager $gateways): Response
    {
        return Inertia::render('pond/admin/payment-settings', [
            'stripe' => [
                'enabled' => $stripe->isEnabled(),
                'source' => match (true) {
                    $stripe->usesDatabaseKeys() => 'dashboard',
                    $stripe->secretKey() !== null => 'environment',
                    default => 'none',
                },
                'mode' => $stripe->mode(),
                'publishable_key' => $stripe->publishableKey(),
                'secret_key_hint' => StripeSettings::mask($stripe->secretKey()),
                'webhook_secret_hint' => StripeSettings::mask($stripe->webhookSecret()),
            ],
            'gateway' => [
                'driver' => $gateways->driver(),
                'mode' => $gateways->mode(),
                'is_test_mode' => $gateways->isTestMode(),
                'is_ready' => $gateways->isReady(),
            ],
            'webhook' => [
                'url' => route('webhooks.stripe'),
                'events' => self::WEBHOOK_EVENTS,
            ],
            'canEdit' => $request->user()->can(PermissionEnum::PAYMENT_SETTINGS_EDIT->value),
        ]);
    }

    public function update(UpdateStripeSettingsRequest $request, StripeSettings $stripe, StripeGateway $gateway): RedirectResponse
    {
        $data = $request->validated();

        if (filled($data['stripe_secret_key'] ?? null)) {
            try {
                $gateway->verifyKey($data['stripe_secret_key']);
            } catch (PaymentGatewayException $exception) {
                throw ValidationException::withMessages(['stripe_secret_key' => $exception->getMessage()]);
            }
        }

        $setting = PaymentSetting::current();

        if (filled($data['stripe_secret_key'] ?? null)) {
            $setting->stripe_secret_key = $data['stripe_secret_key'];
        }

        foreach (['stripe_publishable_key', 'stripe_webhook_secret'] as $field) {
            if (filled($data[$field] ?? null)) {
                $setting->{$field} = $data[$field];
            }
        }

        $setting->stripe_enabled = (bool) $data['stripe_enabled'];
        $setting->save();
        $stripe->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => $this->savedMessage($stripe)]);

        return to_route('admin.stripe.edit');
    }

    /**
     * Ask Stripe whether the saved secret key works.
     */
    public function test(StripeSettings $stripe, StripeGateway $gateway): RedirectResponse
    {
        $secret = $stripe->secretKey();

        if ($secret === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Add a Stripe secret key first.']);

            return to_route('admin.stripe.edit');
        }

        try {
            $result = $gateway->verifyKey($secret);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Connected to Stripe in '.($result['livemode'] ? 'live' : 'test').' mode.']);
        } catch (PaymentGatewayException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return to_route('admin.stripe.edit');
    }

    /**
     * Forget every key saved in the dashboard and switch Stripe off.
     */
    public function destroy(StripeSettings $stripe): RedirectResponse
    {
        PaymentSetting::current()->update([
            'stripe_enabled' => false,
            'stripe_publishable_key' => null,
            'stripe_secret_key' => null,
            'stripe_webhook_secret' => null,
        ]);

        $stripe->flush();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stripe keys removed.']);

        return to_route('admin.stripe.edit');
    }

    private function savedMessage(StripeSettings $stripe): string
    {
        if (! $stripe->isEnabled()) {
            return 'Stripe settings saved. Stripe is switched off.';
        }

        return 'Stripe settings saved. Stripe is on in '.($stripe->isTestMode() ? 'test' : 'live').' mode.';
    }
}
