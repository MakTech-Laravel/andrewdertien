<?php

namespace App\Support\Payments;

class PaymentGatewayManager
{
    /**
     * The provider new checkouts go through.
     *
     * @throws PaymentGatewayException
     */
    public function active(): PaymentGateway
    {
        return $this->for((string) config('payments.driver'));
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

    public function allowsSandbox(): bool
    {
        return ! app()->isProduction();
    }

    public function isTestMode(): bool
    {
        return config('payments.driver') === SandboxGateway::NAME;
    }
}
