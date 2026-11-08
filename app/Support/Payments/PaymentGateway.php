<?php

namespace App\Support\Payments;

use App\Models\PondPurchase;

/**
 * A provider that takes payment for a pond purchase on a hosted checkout page.
 */
interface PaymentGateway
{
    /**
     * The name stored on each purchase so later actions reach the same provider.
     */
    public function name(): string;

    /**
     * @throws PaymentGatewayException
     */
    public function createCheckout(PondPurchase $purchase, string $returnUrl, string $cancelUrl): CheckoutSession;

    /**
     * Ask the provider for the true state of a purchase's checkout.
     *
     * @throws PaymentGatewayException
     */
    public function fetchStatus(PondPurchase $purchase): CheckoutStatus;

    /**
     * Close an open checkout so it can no longer be paid.
     *
     * @throws PaymentGatewayException
     */
    public function cancel(PondPurchase $purchase): void;

    /**
     * Return the full amount of a paid purchase to the buyer.
     *
     * @throws PaymentGatewayException
     */
    public function refund(PondPurchase $purchase): void;
}
