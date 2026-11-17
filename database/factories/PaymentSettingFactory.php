<?php

namespace Database\Factories;

use App\Models\PaymentSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentSetting>
 */
class PaymentSettingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stripe_enabled' => false,
            'stripe_publishable_key' => null,
            'stripe_secret_key' => null,
            'stripe_webhook_secret' => null,
        ];
    }

    /**
     * A complete set of Stripe test-mode keys, switched on.
     */
    public function stripeTest(): static
    {
        return $this->state(fn (): array => [
            'stripe_enabled' => true,
            'stripe_publishable_key' => 'pk_test_abc123',
            'stripe_secret_key' => 'sk_test_abc123',
            'stripe_webhook_secret' => 'whsec_abc123',
        ]);
    }

    /**
     * A complete set of Stripe live-mode keys, switched on.
     */
    public function stripeLive(): static
    {
        return $this->state(fn (): array => [
            'stripe_enabled' => true,
            'stripe_publishable_key' => 'pk_live_abc123',
            'stripe_secret_key' => 'sk_live_abc123',
            'stripe_webhook_secret' => 'whsec_abc123',
        ]);
    }
}
