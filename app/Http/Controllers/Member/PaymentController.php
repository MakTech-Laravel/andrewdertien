<?php

namespace App\Http\Controllers\Member;

use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Models\PondPurchase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = PurchaseStatus::tryFrom((string) $request->query('status'));
        $purchases = $request->user()->pondPurchases();

        return Inertia::render('pond/member/payments', [
            'payments' => (clone $purchases)
                ->with('pond')
                ->when($status, fn ($query) => $query->where('status', $status))
                ->latest('id')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (PondPurchase $purchase): array => $purchase->toHistoryRow()),
            'totalPaidCents' => (int) (clone $purchases)->where('status', PurchaseStatus::PAID)->sum('amount_cents'),
            'currency' => config('payments.currency'),
            'filters' => ['status' => $status?->value ?? ''],
        ]);
    }
}
