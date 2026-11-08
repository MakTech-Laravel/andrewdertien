<?php

namespace App\Http\Controllers;

use App\Models\PondPurchase;
use App\Support\Payments\PondCheckout;
use App\Support\Payments\StripeGateway;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Stripe's own record of what happened. This is what makes a purchase reliable
 * when the buyer closes their browser before returning to the site.
 */
class StripeWebhookController extends Controller
{
    /**
     * How old a signed event may be, in seconds, before it is treated as a replay.
     */
    private const SIGNATURE_TOLERANCE = 300;

    public function __invoke(Request $request, PondCheckout $checkout): Response
    {
        abort_unless($this->hasValidSignature($request), 400);

        $event = $request->json()->all();
        $object = $event['data']['object'] ?? [];
        $type = $event['type'] ?? null;

        if ($type === 'charge.refunded') {
            $this->chargeRefunded($object, $checkout);
        } elseif (is_string($type) && str_starts_with($type, 'checkout.session.') && $purchase = $this->findBySession($object)) {
            $this->sessionChanged($type, $object, $purchase, $checkout);
        }

        return response()->noContent();
    }

    /**
     * Delayed payment methods complete the session before the money arrives; they
     * are settled later by the async_payment_succeeded event.
     *
     * @param  array<string, mixed>  $session
     */
    private function sessionChanged(string $type, array $session, PondPurchase $purchase, PondCheckout $checkout): void
    {
        $paymentId = $session['payment_intent'] ?? null;

        match ($type) {
            'checkout.session.completed' => ($session['payment_status'] ?? null) === 'paid'
                ? $checkout->markPaid($purchase, $paymentId)
                : null,
            'checkout.session.async_payment_succeeded' => $checkout->markPaid($purchase, $paymentId),
            'checkout.session.async_payment_failed' => $checkout->markFailed($purchase, 'The payment did not go through.'),
            'checkout.session.expired' => $checkout->markCancelled($purchase),
            default => null,
        };
    }

    /**
     * A partial refund made in the Stripe dashboard leaves the member owning the pond.
     *
     * @param  array<string, mixed>  $charge
     */
    private function chargeRefunded(array $charge, PondCheckout $checkout): void
    {
        if (($charge['refunded'] ?? false) !== true || empty($charge['payment_intent'])) {
            return;
        }

        $purchase = PondPurchase::query()
            ->where('gateway', StripeGateway::NAME)
            ->where('gateway_payment_id', $charge['payment_intent'])
            ->first();

        if ($purchase) {
            $checkout->markRefunded($purchase);
        }
    }

    /**
     * @param  array<string, mixed>  $session
     */
    private function findBySession(array $session): ?PondPurchase
    {
        if (empty($session['id'])) {
            return null;
        }

        return PondPurchase::query()
            ->where('gateway', StripeGateway::NAME)
            ->where('gateway_session_id', $session['id'])
            ->first();
    }

    /**
     * @see https://docs.stripe.com/webhooks#verify-manually
     */
    private function hasValidSignature(Request $request): bool
    {
        $secret = (string) config('services.stripe.webhook_secret');

        if ($secret === '') {
            return false;
        }

        $timestamp = null;
        $signatures = [];

        foreach (explode(',', (string) $request->header('Stripe-Signature')) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');

            if ($key === 't') {
                $timestamp = (int) $value;
            } elseif ($key === 'v1') {
                $signatures[] = $value;
            }
        }

        if ($timestamp === null || abs(time() - $timestamp) > self::SIGNATURE_TOLERANCE) {
            return false;
        }

        $expected = hash_hmac('sha256', "{$timestamp}.{$request->getContent()}", $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }
}
