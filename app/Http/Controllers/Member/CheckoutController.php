<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Support\Payments\PaymentGatewayException;
use App\Support\Payments\PaymentGatewayManager;
use App\Support\Payments\PondCheckout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckoutController extends Controller
{
    /**
     * Send the member to the provider's checkout page for this pond.
     */
    public function store(Request $request, Pond $pond, PondCheckout $checkout): Response
    {
        abort_unless($pond->is_published, 404);

        try {
            return Inertia::location($checkout->start($request->user(), $pond));
        } catch (PaymentGatewayException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);

            return redirect()->route('member.ponds.index');
        }
    }

    /**
     * The provider sends the buyer back here after paying. The URL proves nothing,
     * so the provider is asked what actually happened.
     */
    public function returned(Request $request, PondPurchase $purchase, PondCheckout $checkout, PaymentGatewayManager $gateways): RedirectResponse
    {
        $this->authorizeBuyer($request, $purchase);

        try {
            $status = $gateways->for($purchase->gateway)->fetchStatus($purchase);

            if ($status->isPaid) {
                $checkout->markPaid($purchase, $status->paymentId);
            }
        } catch (PaymentGatewayException) {
            // The webhook will still record the payment; the member sees it as pending for now.
        }

        if ($purchase->refresh()->isPaid()) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Payment received. {$purchase->pond_name} is yours!"]);

            return redirect()->route('member.ponds.owned');
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'We are still confirming your payment. It will appear here shortly.']);

        return redirect()->route('member.payments.index');
    }

    /**
     * The buyer backed out of the provider's checkout page.
     */
    public function cancelled(Request $request, PondPurchase $purchase, PondCheckout $checkout): RedirectResponse
    {
        $this->authorizeBuyer($request, $purchase);

        if ($purchase->isPending()) {
            try {
                $checkout->closeOrSettle($purchase);
            } catch (PaymentGatewayException) {
                // The session expires by itself and the webhook records it.
            }
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Checkout cancelled. You have not been charged.']);

        return redirect()->route('member.ponds.index');
    }

    private function authorizeBuyer(Request $request, PondPurchase $purchase): void
    {
        abort_unless($purchase->user_id === $request->user()->id, 403);
    }
}
