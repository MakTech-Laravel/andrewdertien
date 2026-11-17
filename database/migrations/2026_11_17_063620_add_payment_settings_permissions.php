<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Creates the payment settings permissions and gives them to the roles that
 * hold them, on databases that already have the roles.
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

        foreach (RoleEnum::cases() as $roleEnum) {
            Role::firstOrCreate(['name' => $roleEnum->value, 'guard_name' => $roleEnum->guard()])
                ->syncPermissions(array_map(fn (PermissionEnum $p): string => $p->value, $roleEnum->permissions()));
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * The permissions are harmless to keep, so rolling back leaves them in place.
     */
    public function down(): void
    {
        //
    }
};
