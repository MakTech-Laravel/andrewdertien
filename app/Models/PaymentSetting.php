<?php

namespace App\Models;

use Database\Factories\PaymentSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The payment provider keys an admin entered in the dashboard. There is only
 * ever one row, and the secrets are encrypted at rest.
 */
#[Fillable(['stripe_enabled', 'stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret'])]
#[Hidden(['stripe_secret_key', 'stripe_webhook_secret'])]
class PaymentSetting extends Model
{
    /** @use HasFactory<PaymentSettingFactory> */
    use HasFactory;

    /**
     * The one settings row, created empty the first time it is needed.
     */
    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stripe_enabled' => 'boolean',
            'stripe_secret_key' => 'encrypted',
            'stripe_webhook_secret' => 'encrypted',
        ];
    }
}
