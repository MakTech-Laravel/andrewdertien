<?php

namespace App\Support\Payments;

use App\Models\PondPurchase;
use Illuminate\Support\Str;

/**
 * A simulated provider for local development: no money moves, and "checkout" is
 * a page inside this application. PaymentGatewayManager refuses it in production.
 */
class SandboxGateway implements PaymentGateway
{
    public const NAME = 'sandbox';

    public function name(): string
    {
        return self::NAME;
    }

    public function createCheckout(PondPurchase $purchase, string $returnUrl, string $cancelUrl): CheckoutSession
    {
        return new CheckoutSession('sandbox_'.Str::random(24), route('payments.sandbox.show', $purchase));
    }

    public function fetchStatus(PondPurchase $purchase): CheckoutStatus
    {
        return $purchase->isPaid()
            ? CheckoutStatus::paid($purchase->gateway_payment_id)
            : CheckoutStatus::open();
    }

    public function cancel(PondPurchase $purchase): void
    {
        //
    }

    public function refund(PondPurchase $purchase): void
    {
        //
    }
}
