<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function registrationPayload(array $overrides = []): array
{
    return [
        'name' => 'Test User',
        'username' => 'test_user',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        ...$overrides,
    ];
}

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), registrationPayload());

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    expect(User::firstWhere('email', 'test@example.com')->getRoleNames()->all())->toBe(['user']);

    expect(User::firstWhere('email', 'test@example.com'))
        ->username->toBe('test_user')
        ->open_to_romance->toBeFalse()
        ->date_of_birth->toBeNull();
});

test('a username is required and must be unique', function () {
    User::factory()->create(['username' => 'test_user']);

    $this->post(route('register.store'), registrationPayload())->assertSessionHasErrors('username');
    $this->post(route('register.store'), registrationPayload(['username' => '']))->assertSessionHasErrors('username');

    $this->assertGuest();
});

test('adults can opt in to romantic connections when registering', function () {
    $this->post(route('register.store'), registrationPayload([
        'open_to_romance' => '1',
        'date_of_birth' => now()->subYears(21)->toDateString(),
    ]))->assertSessionHasNoErrors();

    expect(User::firstWhere('email', 'test@example.com')->isOpenToRomance())->toBeTrue();
});

test('under 18s cannot opt in to romantic connections when registering', function () {
    $this->post(route('register.store'), registrationPayload([
        'open_to_romance' => '1',
        'date_of_birth' => now()->subYears(16)->toDateString(),
    ]))->assertSessionHasErrors('open_to_romance');

    $this->assertGuest();
});
