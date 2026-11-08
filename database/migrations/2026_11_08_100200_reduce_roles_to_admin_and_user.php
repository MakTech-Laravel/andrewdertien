<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * The application only has two roles. Super-admins become admins, every other
 * account (including accounts with no role) becomes a user, and the retired
 * roles and permissions are removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission->value, 'guard_name' => $permission->guard()],
                ['group' => $permission->group()],
            );
        }

        Permission::whereNotIn('name', array_column(PermissionEnum::cases(), 'value'))->delete();

        foreach (RoleEnum::cases() as $roleEnum) {
            Role::firstOrCreate(['name' => $roleEnum->value, 'guard_name' => $roleEnum->guard()])
                ->syncPermissions(array_map(fn (PermissionEnum $p): string => $p->value, $roleEnum->permissions()));
        }

        User::query()->with('roles')->lazyById()->each(function (User $user): void {
            $roles = $user->roles->pluck('name');
            $isAdmin = $roles->contains('super-admin') || $roles->contains(RoleEnum::ADMIN->value);

            $user->syncRoles([$isAdmin ? RoleEnum::ADMIN->value : RoleEnum::USER->value]);
        });

        Role::whereNotIn('name', array_column(RoleEnum::cases(), 'value'))->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * The retired roles and each account's previous role cannot be restored.
     */
    public function down(): void
    {
        //
    }
};
