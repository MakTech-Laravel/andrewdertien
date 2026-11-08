<?php

namespace App\Support\Payments;

use App\Models\PondPurchase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stripe Checkout, spoken to directly over its REST API.
 *
 * @see https://docs.stripe.com/api/checkout/sessions
 */
class StripeGateway implements PaymentGateway
{
    public const NAME = 'stripe';

    private const API = 'https://api.stripe.com/v1';

    public function name(): string
    {
        return self::NAME;
    }

    public function createCheckout(PondPurchase $purchase, string $returnUrl, string $cancelUrl): CheckoutSession
    {
        $session = $this->send(
            fn (PendingRequest $request): Response => $request
                ->withHeaders(['Idempotency-Key' => "checkout-{$purchase->reference}"])
                ->post(self::API.'/checkout/sessions', [
                    'mode' => 'payment',
                    'success_url' => $returnUrl,
                    'cancel_url' => $cancelUrl,
                    'client_reference_id' => $purchase->reference,
                    'customer_email' => $purchase->buyer_email,
                    'line_items' => [[
                        'quantity' => 1,
                        'price_data' => [
                            'currency' => $purchase->currency,
                            'unit_amount' => $purchase->amount_cents,
                            'product_data' => ['name' => $purchase->pond_name],
                        ],
                    ]],
                    'metadata' => ['purchase_reference' => $purchase->reference],
                ]),
        );

        return new CheckoutSession($session['id'], $session['url']);
    }

    public function fetchStatus(PondPurchase $purchase): CheckoutStatus
    {
        $session = $this->send(
            fn (PendingRequest $request): Response => $request->get(self::API."/checkout/sessions/{$purchase->gateway_session_id}"),
        );

        if ($session['payment_status'] === 'paid') {
            return CheckoutStatus::paid($session['payment_intent'] ?? null);
        }

        return $session['status'] === 'open' ? CheckoutStatus::open() : CheckoutStatus::closed();
    }

    public function cancel(PondPurchase $purchase): void
    {
        $this->send(
            fn (PendingRequest $request): Response => $request->post(self::API."/checkout/sessions/{$purchase->gateway_session_id}/expire"),
        );
    }

    public function refund(PondPurchase $purchase): void
    {
        $this->send(
            fn (PendingRequest $request): Response => $request
                ->withHeaders(['Idempotency-Key' => "refund-{$purchase->reference}"])
                ->post(self::API.'/refunds', ['payment_intent' => $purchase->gateway_payment_id]),
        );
    }

    /**
     * @param  callable(PendingRequest): Response  $call
     * @return array<string, mixed>
     *
     * @throws PaymentGatewayException
     */
    private function send(callable $call): array
    {
        $secret = (string) config('services.stripe.secret');

        if ($secret === '') {
            throw new PaymentGatewayException('Online payments are not configured yet.');
        }

        try {
            $response = $call(Http::asForm()->withToken($secret)->timeout(20)->retry(2, 200, throw: false));
        } catch (ConnectionException $exception) {
            Log::error('Stripe could not be reached.', ['error' => $exception->getMessage()]);

            throw new PaymentGatewayException('The payment provider could not be reached. Please try again.', previous: $exception);
        }

        if ($response->failed()) {
            Log::error('Stripe rejected a request.', ['status' => $response->status(), 'error' => $response->json('error.message')]);

            throw new PaymentGatewayException('The payment provider declined this request. Please try again.');
        }

        return $response->json();
    }
}
