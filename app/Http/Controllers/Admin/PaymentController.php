<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Support\Payments\PaymentGatewayException;
use App\Support\Payments\PondCheckout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Who bought which pond, and every payment behind it.
 */
class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = PurchaseStatus::tryFrom((string) $request->query('status'));
        $pondId = $request->integer('pond') ?: null;

        return Inertia::render('pond/admin/payments', [
            'payments' => PondPurchase::query()
                ->with('pond')
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($pondId, fn ($query) => $query->where('pond_id', $pondId))
                ->when($search !== '', function ($query) use ($search): void {
                    $query->where(function ($query) use ($search): void {
                        $query->where('buyer_name', 'like', "%{$search}%")
                            ->orWhere('buyer_email', 'like', "%{$search}%")
                            ->orWhere('pond_name', 'like', "%{$search}%")
                            ->orWhere('reference', 'like', "%{$search}%");
                    });
                })
                ->latest('id')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (PondPurchase $purchase): array => $purchase->toHistoryRow()),
            'totals' => [
                'paid_cents' => (int) PondPurchase::query()->where('status', PurchaseStatus::PAID)->sum('amount_cents'),
                'refunded_cents' => (int) PondPurchase::query()->where('status', PurchaseStatus::REFUNDED)->sum('amount_cents'),
                'pending' => PondPurchase::query()->where('status', PurchaseStatus::PENDING)->count(),
            ],
            'currency' => config('payments.currency'),
            'ponds' => Pond::withTrashed()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'status' => $status?->value ?? '',
                'pond' => $pondId,
            ],
        ]);
    }

    public function refund(PondPurchase $purchase, PondCheckout $checkout): RedirectResponse
    {
        try {
            $checkout->refund($purchase);

            Inertia::flash('toast', ['type' => 'success', 'message' => "{$purchase->reference} refunded."]);
        } catch (PaymentGatewayException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return redirect()->back();
    }
}
