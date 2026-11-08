<?php

namespace App\Support\Payments;

use App\Enums\PurchaseStatus;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Every change to a purchase's status goes through here, so the browser return,
 * the provider's webhook and admin actions can arrive in any order, any number
 * of times, and still leave one correct result.
 */
class PondCheckout
{
    public function __construct(private PaymentGatewayManager $gateways) {}

    /**
     * Open a checkout for this member and return the URL to send them to.
     *
     * @throws PaymentGatewayException
     */
    public function start(User $user, Pond $pond): string
    {
        $lock = Cache::lock("pond-checkout:{$user->id}:{$pond->id}", 30);

        if (! $lock->get()) {
            throw new PaymentGatewayException('Your checkout is already being prepared.');
        }

        try {
            $this->closeOpenCheckouts($user, $pond);

            if ($user->ownsPond($pond)) {
                throw new PaymentGatewayException('You already own this pond.');
            }

            return $this->openCheckout($user, $pond);
        } finally {
            $lock->release();
        }
    }

    /**
     * Close a member's abandoned checkout, or record it as paid if the provider
     * says the money did arrive.
     *
     * @throws PaymentGatewayException
     */
    public function closeOrSettle(PondPurchase $purchase): void
    {
        $gateway = $this->gateways->for($purchase->gateway);
        $status = $gateway->fetchStatus($purchase);

        if ($status->isPaid) {
            $this->markPaid($purchase, $status->paymentId);

            return;
        }

        if ($status->isOpen) {
            $gateway->cancel($purchase);
        }

        $this->markCancelled($purchase);
    }

    /**
     * Money was received. This wins over any earlier cancelled or failed state.
     */
    public function markPaid(PondPurchase $purchase, ?string $paymentId): void
    {
        $this->transition($purchase, function (PondPurchase $current) use ($paymentId): void {
            if (in_array($current->status, [PurchaseStatus::PAID, PurchaseStatus::REFUNDED], true)) {
                return;
            }

            $current->update([
                'status' => PurchaseStatus::PAID,
                'gateway_payment_id' => $paymentId,
                'failure_message' => null,
                'paid_at' => now(),
            ]);
        });
    }

    public function markFailed(PondPurchase $purchase, string $message): void
    {
        $this->transition($purchase, function (PondPurchase $current) use ($message): void {
            if ($current->isPending()) {
                $current->update(['status' => PurchaseStatus::FAILED, 'failure_message' => $message]);
            }
        });
    }

    public function markCancelled(PondPurchase $purchase): void
    {
        $this->transition($purchase, function (PondPurchase $current): void {
            if ($current->isPending()) {
                $current->update(['status' => PurchaseStatus::CANCELLED]);
            }
        });
    }

    public function markRefunded(PondPurchase $purchase): void
    {
        $this->transition($purchase, function (PondPurchase $current): void {
            if ($current->isPaid()) {
                $current->update(['status' => PurchaseStatus::REFUNDED, 'refunded_at' => now()]);
            }
        });
    }

    /**
     * Return a paid purchase's money to the buyer. The member stops owning the pond.
     *
     * @throws PaymentGatewayException
     */
    public function refund(PondPurchase $purchase): void
    {
        if (! $purchase->isPaid()) {
            throw new PaymentGatewayException('Only a paid purchase can be refunded.');
        }

        $this->gateways->for($purchase->gateway)->refund($purchase);

        $this->markRefunded($purchase);
    }

    /**
     * @throws PaymentGatewayException
     */
    private function closeOpenCheckouts(User $user, Pond $pond): void
    {
        $user->pondPurchases()
            ->where('pond_id', $pond->id)
            ->where('status', PurchaseStatus::PENDING)
            ->get()
            ->each(fn (PondPurchase $purchase) => $this->closeOrSettle($purchase));
    }

    /**
     * @throws PaymentGatewayException
     */
    private function openCheckout(User $user, Pond $pond): string
    {
        $gateway = $this->gateways->active();

        $purchase = $user->pondPurchases()->create([
            'pond_id' => $pond->id,
            'buyer_name' => $user->name,
            'buyer_email' => $user->email,
            'pond_name' => $pond->name,
            'amount_cents' => $pond->price_cents,
            'currency' => config('payments.currency'),
            'status' => PurchaseStatus::PENDING,
            'gateway' => $gateway->name(),
        ]);

        try {
            $session = $gateway->createCheckout(
                $purchase,
                route('payments.return', $purchase),
                route('payments.cancel', $purchase),
            );
        } catch (PaymentGatewayException $exception) {
            $this->markFailed($purchase, $exception->getMessage());

            throw $exception;
        }

        $purchase->update(['gateway_session_id' => $session->id]);

        return $session->url;
    }

    /**
     * @param  Closure(PondPurchase): void  $change
     */
    private function transition(PondPurchase $purchase, Closure $change): void
    {
        DB::transaction(function () use ($purchase, $change): void {
            $change(PondPurchase::query()->lockForUpdate()->findOrFail($purchase->id));
        });

        $purchase->refresh();
    }
}
