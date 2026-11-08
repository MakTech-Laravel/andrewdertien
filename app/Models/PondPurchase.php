<?php

namespace App\Models;

use App\Enums\PurchaseStatus;
use Database\Factories\PondPurchaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * One attempt by a member to buy a pond, together with its payment. A pond is
 * owned while the member has a purchase in the "paid" status.
 */
#[Fillable([
    'reference', 'user_id', 'pond_id', 'buyer_name', 'buyer_email', 'pond_name', 'amount_cents',
    'currency', 'status', 'gateway', 'gateway_session_id', 'gateway_payment_id',
    'failure_message', 'paid_at', 'refunded_at',
])]
class PondPurchase extends Model
{
    /** @use HasFactory<PondPurchaseFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (PondPurchase $purchase): void {
            $purchase->reference ??= 'AUP-'.Str::upper(Str::random(10));
        });
    }

    public function getRouteKeyName(): string
    {
        return 'reference';
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Pond, $this>
     */
    public function pond(): BelongsTo
    {
        return $this->belongsTo(Pond::class)->withTrashed();
    }

    public function isPending(): bool
    {
        return $this->status === PurchaseStatus::PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === PurchaseStatus::PAID;
    }

    /**
     * The fields shown on a row of any purchase or payment history.
     *
     * @return array{reference: string, user_id: int|null, buyer_name: string, buyer_email: string, pond_name: string, pond_slug: string|null, amount_cents: int, currency: string, status: string, gateway: string, failure_message: string|null, created_at: string|null, paid_at: string|null, refunded_at: string|null}
     */
    public function toHistoryRow(): array
    {
        return [
            'reference' => $this->reference,
            'user_id' => $this->user_id,
            'buyer_name' => $this->buyer_name,
            'buyer_email' => $this->buyer_email,
            'pond_name' => $this->pond_name,
            'pond_slug' => $this->pond?->slug,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'status' => $this->status->value,
            'gateway' => $this->gateway,
            'failure_message' => $this->failure_message,
            'created_at' => $this->created_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'refunded_at' => $this->refunded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'status' => PurchaseStatus::class,
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }
}
