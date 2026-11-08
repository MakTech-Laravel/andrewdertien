<?php

namespace App\Http\Controllers\Member;

use App\Enums\PondCategory;
use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Support\Payments\PaymentGatewayManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PondController extends Controller
{
    /**
     * Every published pond a member can choose, including ones hidden from the public site.
     */
    public function index(Request $request, PaymentGatewayManager $gateways): Response
    {
        $category = PondCategory::tryFrom((string) $request->query('category'));

        return Inertia::render('pond/member/ponds', [
            'ponds' => Pond::query()
                ->published()
                ->when($category, fn ($query) => $query->where('category', $category))
                ->ordered()
                ->get()
                ->map->toCard(),
            'ownedPondIds' => $request->user()->pondPurchases()->where('status', PurchaseStatus::PAID)->pluck('pond_id'),
            'categories' => collect(PondCategory::cases())
                ->map(fn (PondCategory $option): array => ['value' => $option->value, 'label' => $option->label()]),
            'filters' => ['category' => $category?->value ?? ''],
            'isTestMode' => $gateways->isTestMode(),
        ]);
    }

    /**
     * The ponds this member owns.
     */
    public function owned(Request $request): Response
    {
        return Inertia::render('pond/member/my-ponds', [
            'purchases' => $request->user()->pondPurchases()
                ->with('pond')
                ->where('status', PurchaseStatus::PAID)
                ->latest('paid_at')
                ->get()
                ->map(fn (PondPurchase $purchase): array => [
                    ...$purchase->toHistoryRow(),
                    'pond' => $purchase->pond->toCard(),
                ]),
        ]);
    }
}
