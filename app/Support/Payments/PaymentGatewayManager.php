<?php

namespace App\Support\Payments;

class PaymentGatewayManager
{
    /**
     * Payments are being simulated locally; no money moves.
     */
    public const MODE_SANDBOX = 'sandbox';

    /**
     * Stripe with test keys; test cards only, no real money.
     */
    public const MODE_TEST = 'test';

    /**
     * Stripe with live keys; real cards are charged.
     */
    public const MODE_LIVE = 'live';

    /**
     * Stripe is on but its keys are missing or unrecognised.
     */
    public const MODE_UNCONFIGURED = 'unconfigured';

    /**
     * No provider is available to take payments.
     */
    public const MODE_UNAVAILABLE = 'unavailable';

    public function __construct(private StripeSettings $stripe) {}

    /**
     * The provider new checkouts go through.
     *
     * @throws PaymentGatewayException
     */
    public function active(): PaymentGateway
    {
        return $this->for($this->driver());
    }

    /**
     * @throws PaymentGatewayException
     */
    public function for(string $name): PaymentGateway
    {
        return match (true) {
            $name === StripeGateway::NAME => app(StripeGateway::class),
            $name === SandboxGateway::NAME && $this->allowsSandbox() => app(SandboxGateway::class),
            default => throw new PaymentGatewayException('Online payments are not available right now.'),
        };
    }

    /**
     * The name of the provider new checkouts use: Stripe once an admin has
     * switched it on (or the environment selects it), otherwise the local
     * sandbox, and "none" when Stripe was switched off where the sandbox is not allowed.
     */
    public function driver(): string
    {
        if ($this->stripe->isEnabled()) {
            return StripeGateway::NAME;
        }

        if ($this->stripe->usesDatabaseKeys()) {
            return $this->allowsSandbox() ? SandboxGateway::NAME : 'none';
        }

        return (string) config('payments.driver');
    }

    public function allowsSandbox(): bool
    {
        return ! app()->isProduction();
    }

    /**
     * One of the MODE_* constants: what kind of payments members would make right now.
     */
    public function mode(): string
    {
        return match ($this->driver()) {
            SandboxGateway::NAME => $this->allowsSandbox() ? self::MODE_SANDBOX : self::MODE_UNAVAILABLE,
            StripeGateway::NAME => match ($this->stripe->mode()) {
                StripeSettings::MODE_TEST => self::MODE_TEST,
                StripeSettings::MODE_LIVE => self::MODE_LIVE,
                default => self::MODE_UNCONFIGURED,
            },
            default => self::MODE_UNAVAILABLE,
        };
    }

    /**
     * Whether payments are fake: the local sandbox or Stripe's test mode.
     */
    public function isTestMode(): bool
    {
        return in_array($this->mode(), [self::MODE_SANDBOX, self::MODE_TEST], true);
    }

    /**
     * Whether members can actually pay right now.
     */
    public function isReady(): bool
    {
        return match ($this->mode()) {
            self::MODE_SANDBOX => true,
            self::MODE_TEST, self::MODE_LIVE => $this->stripe->isConfigured(),
            default => false,
        };
    }
}
