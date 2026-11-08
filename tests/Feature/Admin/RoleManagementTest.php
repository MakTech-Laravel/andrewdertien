<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed([PermissionSeeder::class, RoleSeeder::class]);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(RoleEnum::ADMIN->value);
});

test('only the admin and user roles exist', function () {
    expect(Role::pluck('name')->sort()->values()->all())->toBe(['admin', 'user'])
        ->and(array_column(RoleEnum::cases(), 'value'))->toBe(['admin', 'user']);
});

test('an admin can view the two roles and their permissions', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/roles/index')
            ->has('roles', 2)
            ->where('roles.0.name', 'admin')
            ->has('roles.0.permissions')
        );
});

test('a user cannot view the roles', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::USER->value);

    $this->actingAs($user)->get(route('admin.roles.index'))->assertForbidden();
});

test('roles cannot be created, edited or deleted', function (string $routeName) {
    expect(Route::has($routeName))->toBeFalse();
})->with(['admin.roles.create', 'admin.roles.store', 'admin.roles.edit', 'admin.roles.update', 'admin.roles.destroy']);

test('admins cannot act as a member and users cannot act as an admin', function () {
    $admin = RoleEnum::ADMIN->permissions();
    $user = RoleEnum::USER->permissions();

    foreach (PermissionEnum::memberOnly() as $memberPermission) {
        expect($admin)->not->toContain($memberPermission)
            ->and($user)->toContain($memberPermission);
    }

    expect($user)->not->toContain(PermissionEnum::ADMIN_DASHBOARD_VIEW)
        ->and($user)->not->toContain(PermissionEnum::PONDS_CREATE)
        ->and($user)->not->toContain(PermissionEnum::PAYMENTS_REFUND)
        ->and($user)->not->toContain(PermissionEnum::USERS_INDEX);
});

test('the role migration moves every account onto admin or user', function () {
    $superAdmin = User::factory()->create();
    $editor = User::factory()->create();
    $noRole = User::factory()->create();

    $superAdmin->assignRole(Role::create(['name' => 'super-admin', 'guard_name' => 'web']));
    $editor->assignRole(Role::create(['name' => 'editor', 'guard_name' => 'web']));

    $migration = require database_path('migrations/2026_11_08_100200_reduce_roles_to_admin_and_user.php');
    $migration->up();

    expect($superAdmin->fresh()->getRoleNames()->all())->toBe(['admin'])
        ->and($editor->fresh()->getRoleNames()->all())->toBe(['user'])
        ->and($noRole->fresh()->getRoleNames()->all())->toBe(['user'])
        ->and($this->admin->fresh()->getRoleNames()->all())->toBe(['admin'])
        ->and(Role::pluck('name')->sort()->values()->all())->toBe(['admin', 'user']);
});
