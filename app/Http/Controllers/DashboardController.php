<?php

namespace App\Http\Controllers;

use App\Enums\PurchaseStatus;
use App\Models\Pond;
use App\Models\PondPurchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where everyone lands after logging in: admins go to the admin dashboard,
 * everyone else to their own.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        $paid = $user->pondPurchases()->where('status', PurchaseStatus::PAID);
        $ownedPondIds = (clone $paid)->pluck('pond_id');

        return Inertia::render('pond/member/dashboard', [
            'stats' => [
                'owned' => $ownedPondIds->count(),
                'spent_cents' => (int) (clone $paid)->sum('amount_cents'),
                'payments' => $user->pondPurchases()->count(),
                'available' => Pond::query()->published()->whereNotIn('id', $ownedPondIds)->count(),
            ],
            'currency' => config('payments.currency'),
            'recentPayments' => $user->pondPurchases()->with('pond')->latest('id')->limit(5)->get()
                ->map(fn (PondPurchase $purchase): array => $purchase->toHistoryRow()),
            'suggestedPonds' => Pond::query()->published()->whereNotIn('id', $ownedPondIds)->ordered()->limit(3)->get()->map->toCard(),
        ]);
    }
}
