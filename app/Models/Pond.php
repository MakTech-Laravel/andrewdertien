<?php

namespace App\Models;

use App\Enums\PondCategory;
use Database\Factories\PondFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'name', 'slug', 'tagline', 'description', 'category', 'price_cents', 'ball_art',
    'image', 'is_published', 'show_on_frontend', 'sort_order',
])]
class Pond extends Model
{
    /** @use HasFactory<PondFactory> */
    use HasFactory, SoftDeletes;

    public const DEFAULT_ARTWORK = 'golf-blue';

    /**
     * Golf ball artwork in public/askupon/balls.
     *
     * @var list<string>
     */
    public const GOLF_BALLS = ['blue', 'purple', 'gold', 'white', 'red', 'green', 'violet', 'sky', 'orange', 'lime', 'pink', 'rainbow'];

    /**
     * Marble artwork in public/quantum/images.
     *
     * @var list<int>
     */
    public const MARBLES = [2, 5, 10, 20, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 250000, 500000, 1000000];

    /**
     * Every artwork a pond can use, keyed by the value stored in ball_art.
     *
     * @return array<string, string>
     */
    public static function artwork(): array
    {
        $artwork = [];

        foreach (self::GOLF_BALLS as $color) {
            $artwork["golf-{$color}"] = "/askupon/balls/golf-{$color}.svg";
        }

        foreach (self::MARBLES as $value) {
            $artwork["marble-{$value}"] = "/quantum/images/ball-{$value}.png";
        }

        return $artwork;
    }

    protected static function booted(): void
    {
        static::creating(function (Pond $pond): void {
            $pond->slug ??= self::uniqueSlug($pond->name);
        });
    }

    private static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'pond';
        $slug = $base;

        for ($suffix = 2; self::withTrashed()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * @return HasMany<PondPurchase, $this>
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(PondPurchase::class);
    }

    /**
     * Ponds members can choose from their dashboard.
     *
     * @param  Builder<Pond>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * Ponds the admin has chosen to show on the public website.
     *
     * @param  Builder<Pond>  $query
     */
    #[Scope]
    protected function onFrontend(Builder $query): void
    {
        $query->where('is_published', true)->where('show_on_frontend', true);
    }

    /**
     * @param  Builder<Pond>  $query
     */
    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('id');
    }

    public function imageUrl(): string
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : self::artwork()[$this->ball_art] ?? self::artwork()[self::DEFAULT_ARTWORK];
    }

    /**
     * The fields shown wherever a pond appears as a card.
     *
     * @return array{id: int, name: string, slug: string, tagline: string|null, description: string|null, category: string, category_label: string, price_cents: int, currency: string, image_url: string}
     */
    public function toCard(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'price_cents' => $this->price_cents,
            'currency' => config('payments.currency'),
            'image_url' => $this->imageUrl(),
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => PondCategory::class,
            'price_cents' => 'integer',
            'is_published' => 'boolean',
            'show_on_frontend' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
