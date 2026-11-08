<?php

namespace App\Enums;

/**
 * The only two roles in the application: admins run the site, users buy ponds.
 */
enum RoleEnum: string
{
    case ADMIN = 'admin';
    case USER = 'user';

    public function guard(): string
    {
        return GuardEnum::WEB->value;
    }

    /**
     * The permissions this role receives. Re-run RoleSeeder after changing them.
     *
     * @return array<int, PermissionEnum>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::ADMIN => array_values(array_filter(
                PermissionEnum::cases(),
                fn (PermissionEnum $permission): bool => ! in_array($permission, PermissionEnum::memberOnly(), true),
            )),

            self::USER => [
                PermissionEnum::DASHBOARD_VIEW,
                PermissionEnum::POSTS_VIEW,
                ...PermissionEnum::memberOnly(),
            ],
        };
    }
}
