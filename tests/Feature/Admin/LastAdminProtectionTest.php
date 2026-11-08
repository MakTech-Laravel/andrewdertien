<?php

use App\Enums\RoleEnum;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed([PermissionSeeder::class, RoleSeeder::class]);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(RoleEnum::ADMIN->value);
});

function makeAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    return $user;
}

test('the removed super-admin role cannot be assigned', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Sneaky',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'roles' => ['super-admin'],
        ])
        ->assertSessionHasErrors('roles.0');

    expect(User::where('email', 'sneaky@example.com')->exists())->toBeFalse();
});

test('an admin can make another user an admin', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'New Admin',
            'email' => 'newadmin@example.com',
            'password' => 'password123',
            'roles' => [RoleEnum::ADMIN->value],
        ])
        ->assertRedirect(route('admin.users.index'));

    expect(User::where('email', 'newadmin@example.com')->sole()->isAdmin())->toBeTrue();
});

test('an admin can delete another admin', function () {
    $other = makeAdmin();

    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $other))
        ->assertRedirect();

    expect(User::find($other->id))->toBeNull();
});

test('the last admin cannot remove their own admin role', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->admin), [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'roles' => [RoleEnum::USER->value],
        ])
        ->assertSessionHasErrors('roles');

    expect($this->admin->fresh()->isAdmin())->toBeTrue();
});

test('the admin role can be removed once another admin exists', function () {
    makeAdmin();

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->admin), [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'roles' => [RoleEnum::USER->value],
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($this->admin->fresh()->isAdmin())->toBeFalse();
});

test('the last admin cannot be deleted', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->admin))
        ->assertRedirect();

    expect(User::find($this->admin->id))->not->toBeNull();
});
