<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\PondPurchase;
use App\Support\Payments\PaymentGatewayManager;
use App\Support\Payments\PondCheckout;
use App\Support\Payments\SandboxGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Stands in for a provider's hosted checkout page during local development.
 * Never reachable in production.
 */
class SandboxCheckoutController extends Controller
{
    public function __construct(private PaymentGatewayManager $gateways) {}

    public function show(Request $request, PondPurchase $purchase): Response
    {
        $this->authorizeSandbox($request, $purchase);

        return Inertia::render('pond/member/sandbox-checkout', [
            'purchase' => $purchase->toHistoryRow(),
        ]);
    }

    public function complete(Request $request, PondPurchase $purchase, PondCheckout $checkout): RedirectResponse
    {
        $this->authorizeSandbox($request, $purchase);

        $outcome = $request->validate(['outcome' => ['required', Rule::in(['pay', 'decline'])]])['outcome'];

        if ($outcome === 'pay') {
            $checkout->markPaid($purchase, 'sandbox_pay_'.Str::random(16));

            return redirect()->route('payments.return', $purchase);
        }

        $checkout->markFailed($purchase, 'Declined in the test checkout.');
        Inertia::flash('toast', ['type' => 'error', 'message' => 'The test payment was declined.']);

        return redirect()->route('member.payments.index');
    }

    private function authorizeSandbox(Request $request, PondPurchase $purchase): void
    {
        abort_unless($this->gateways->allowsSandbox() && $purchase->gateway === SandboxGateway::NAME, 404);
        abort_unless($purchase->user_id === $request->user()->id, 403);
        abort_unless($purchase->isPending(), 404);
    }
}
