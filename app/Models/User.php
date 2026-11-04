<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\GuardEnum;
use App\Enums\RoleEnum;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name', 'username', 'email', 'password', 'avatar', 'location', 'date_of_birth',
    'dreams', 'fun', 'treats', 'boost', 'open_to_romance',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The four profile sections every member can fill in (all optional).
     *
     * @var list<string>
     */
    public const PROFILE_CATEGORIES = ['dreams', 'fun', 'treats', 'boost'];

    /**
     * Minimum age for Romantic Connections.
     */
    public const ROMANCE_MINIMUM_AGE = 18;

    /**
     * Whether the member's stated date of birth makes them an adult.
     */
    public function isAdult(): bool
    {
        return $this->date_of_birth !== null
            && $this->date_of_birth->age >= self::ROMANCE_MINIMUM_AGE;
    }

    /**
     * Romantic Connections only counts when an adult has opted in.
     */
    public function isOpenToRomance(): bool
    {
        return $this->open_to_romance && $this->isAdult();
    }

    /**
     * Public URL of the profile picture, if one has been uploaded.
     */
    public function avatarUrl(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return str_starts_with($this->avatar, 'http')
            ? $this->avatar
            : Storage::disk('public')->url($this->avatar);
    }

    /**
     * The fields shown on a member's public profile. Email, date of birth and
     * other account details are deliberately left out.
     *
     * @return array{id: int, name: string, username: string|null, location: string|null, avatar_url: string|null, dreams: string|null, fun: string|null, treats: string|null, boost: string|null, open_to_romance: bool, member_since: string}
     */
    public function toPublicProfile(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'location' => $this->location,
            'avatar_url' => $this->avatarUrl(),
            'dreams' => $this->dreams,
            'fun' => $this->fun,
            'treats' => $this->treats,
            'boost' => $this->boost,
            'open_to_romance' => $this->isOpenToRomance(),
            'member_since' => $this->created_at?->format('F Y') ?? '',
        ];
    }

    /**
     * Members who have chosen a username can be found and visited.
     *
     * @param  Builder<User>  $query
     */
    #[Scope]
    protected function discoverable(Builder $query): void
    {
        $query->whereNotNull('username');
    }

    public function guardName(): string
    {
        return GuardEnum::WEB->value;
    }

    /**
     * Whether this account holds the super-admin role.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleEnum::SUPER_ADMIN->value);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'date_of_birth' => 'date',
            'open_to_romance' => 'boolean',
        ];
    }
}
