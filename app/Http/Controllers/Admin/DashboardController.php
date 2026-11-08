<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PurchaseStatus;
use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use App\Support\Payments\PaymentGatewayManager;
use App\Support\Payments\StripeGateway;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const REVENUE_MONTHS = 6;

    public function __invoke(PaymentGatewayManager $gateways): Response
    {
        $paid = PondPurchase::query()->where('status', PurchaseStatus::PAID);

        return Inertia::render('pond/admin/dashboard', [
            'stats' => [
                'revenue_cents' => (int) (clone $paid)->sum('amount_cents'),
                'revenue_30d_cents' => (int) (clone $paid)->where('paid_at', '>=', now()->subDays(30))->sum('amount_cents'),
                'purchases' => (clone $paid)->count(),
                'members' => User::role(RoleEnum::USER->value)->count(),
                'buyers' => (clone $paid)->whereNotNull('user_id')->distinct()->count('user_id'),
                'ponds' => Pond::count(),
                'ponds_on_frontend' => Pond::query()->onFrontend()->count(),
            ],
            'currency' => config('payments.currency'),
            'revenueByMonth' => $this->revenueByMonth(),
            'recentPayments' => PondPurchase::query()->with('pond')->latest('id')->limit(6)->get()
                ->map(fn (PondPurchase $purchase): array => $purchase->toHistoryRow()),
            'topPonds' => Pond::query()
                ->withCount(['purchases as sales' => fn ($query) => $query->where('status', PurchaseStatus::PAID)])
                ->withSum(['purchases as revenue_cents' => fn ($query) => $query->where('status', PurchaseStatus::PAID)], 'amount_cents')
                ->orderByDesc('sales')
                ->limit(5)
                ->get()
                ->map(fn (Pond $pond): array => [
                    'id' => $pond->id,
                    'name' => $pond->name,
                    'image_url' => $pond->imageUrl(),
                    'sales' => $pond->sales,
                    'revenue_cents' => (int) $pond->revenue_cents,
                ]),
            'gateway' => [
                'driver' => config('payments.driver'),
                'is_test_mode' => $gateways->isTestMode(),
                'is_ready' => $gateways->isTestMode()
                    ? $gateways->allowsSandbox()
                    : config('payments.driver') === StripeGateway::NAME && filled(config('services.stripe.secret')) && filled(config('services.stripe.webhook_secret')),
            ],
        ]);
    }

    /**
     * @return Collection<int, array{month: string, revenue_cents: int}>
     */
    private function revenueByMonth(): Collection
    {
        $firstMonth = CarbonImmutable::now()->startOfMonth()->subMonths(self::REVENUE_MONTHS - 1);

        $totals = PondPurchase::query()
            ->where('status', PurchaseStatus::PAID)
            ->where('paid_at', '>=', $firstMonth)
            ->get(['paid_at', 'amount_cents'])
            ->groupBy(fn (PondPurchase $purchase): string => $purchase->paid_at->format('Y-m'))
            ->map(fn (Collection $purchases): int => (int) $purchases->sum('amount_cents'));

        return collect(range(0, self::REVENUE_MONTHS - 1))->map(function (int $offset) use ($firstMonth, $totals): array {
            $month = $firstMonth->addMonths($offset);

            return ['month' => $month->format('M'), 'revenue_cents' => $totals->get($month->format('Y-m'), 0)];
        });
    }
}
