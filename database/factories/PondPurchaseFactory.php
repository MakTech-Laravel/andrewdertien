<?php

namespace Database\Factories;

use App\Enums\PurchaseStatus;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PondPurchase>
 */
class PondPurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'pond_id' => Pond::factory(),
            'buyer_name' => fn (array $attributes): string => User::find($attributes['user_id'])->name,
            'buyer_email' => fn (array $attributes): string => User::find($attributes['user_id'])->email,
            'pond_name' => fn (array $attributes): string => Pond::find($attributes['pond_id'])->name,
            'amount_cents' => fn (array $attributes): int => Pond::find($attributes['pond_id'])->price_cents,
            'currency' => 'usd',
            'status' => PurchaseStatus::PENDING,
            'gateway' => 'sandbox',
            'gateway_session_id' => fn (): string => 'sandbox_'.fake()->unique()->uuid(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (): array => [
            'status' => PurchaseStatus::PAID,
            'gateway_payment_id' => 'pay_'.fake()->unique()->uuid(),
            'paid_at' => now(),
        ]);
    }
}
