<?php

namespace App\Support;

use App\Enums\RoleEnum;
use App\Models\User;

/**
 * The system must always keep at least one admin account.
 */
final class LastAdmin
{
    public static function count(): int
    {
        return User::role(RoleEnum::ADMIN->value)->count();
    }

    /**
     * Whether removing the admin role from (or deleting) this account would
     * leave the system with no admin at all.
     */
    public static function is(User $user): bool
    {
        return $user->isAdmin() && self::count() <= 1;
    }
}
