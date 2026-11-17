<?php

namespace App\Support\Payments;

use App\Models\PaymentSetting;

/**
 * Where the Stripe keys come from. Keys an admin saved in the dashboard win;
 * the STRIPE_* environment values remain as the fallback so existing setups
 * keep working. Whether Stripe is in test or live mode is never entered by
 * hand: it is read from the secret key itself ("sk_test_…" or "sk_live_…").
 */
class StripeSettings
{
    public const MODE_TEST = 'test';

    public const MODE_LIVE = 'live';

    private ?PaymentSetting $row = null;

    private bool $loaded = false;

    /**
     * Whether the keys come from the dashboard rather than the environment.
     */
    public function usesDatabaseKeys(): bool
    {
        return filled($this->row()?->stripe_secret_key);
    }

    /**
     * Whether new checkouts should go through Stripe.
     */
    public function isEnabled(): bool
    {
        if ($this->usesDatabaseKeys()) {
            return (bool) $this->row()->stripe_enabled;
        }

        return config('payments.driver') === StripeGateway::NAME;
    }

    public function secretKey(): ?string
    {
        return $this->usesDatabaseKeys()
            ? $this->row()->stripe_secret_key
            : $this->nullIfBlank(config('services.stripe.secret'));
    }

    public function publishableKey(): ?string
    {
        return $this->usesDatabaseKeys()
            ? $this->nullIfBlank($this->row()->stripe_publishable_key)
            : null;
    }

    public function webhookSecret(): ?string
    {
        return $this->usesDatabaseKeys()
            ? $this->nullIfBlank($this->row()->stripe_webhook_secret)
            : $this->nullIfBlank(config('services.stripe.webhook_secret'));
    }

    /**
     * "test" or "live", read from the secret key, or null when it is missing or unrecognised.
     */
    public function mode(): ?string
    {
        return self::modeOf($this->secretKey());
    }

    public function isTestMode(): bool
    {
        return $this->mode() === self::MODE_TEST;
    }

    /**
     * Whether everything needed to take payments and hear back from Stripe is present.
     */
    public function isConfigured(): bool
    {
        return $this->mode() !== null && filled($this->webhookSecret());
    }

    /**
     * The mode a Stripe key belongs to, judged by its prefix.
     */
    public static function modeOf(?string $key): ?string
    {
        return match (true) {
            $key === null => null,
            (bool) preg_match('/^(sk|rk|pk)_test_/', $key) => self::MODE_TEST,
            (bool) preg_match('/^(sk|rk|pk)_live_/', $key) => self::MODE_LIVE,
            default => null,
        };
    }

    /**
     * A key with its middle hidden, safe to show back to an admin.
     */
    public static function mask(?string $key): ?string
    {
        if ($key === null || $key === '') {
            return null;
        }

        $prefix = preg_match('/^[a-z]+_(?:test_|live_)?/', $key, $match) === 1 ? $match[0] : '';

        return $prefix.str_repeat('•', 8).substr($key, -4);
    }

    /**
     * Forget what was read, after the settings have changed.
     */
    public function flush(): void
    {
        $this->row = null;
        $this->loaded = false;
    }

    private function row(): ?PaymentSetting
    {
        if (! $this->loaded) {
            $this->row = PaymentSetting::query()->first();
            $this->loaded = true;
        }

        return $this->row;
    }

    private function nullIfBlank(mixed $value): ?string
    {
        return filled($value) ? (string) $value : null;
    }
}
