<?php

use App\Enums\Interest;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot reach step 2 of sign-up', function () {
    $this->get(route('splash.show'))->assertRedirect(route('login'));
    $this->post(route('splash.store'))->assertRedirect(route('login'));
});

test('step 2 offers every interest and starts empty for a new member', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('splash.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/splash')
            ->has('interestOptions', count(Interest::cases()))
            ->where('interestOptions.0', ['value' => 'art-and-creativity', 'label' => 'Art & Creativity'])
            ->where('profile.interests', [])
            ->where('profile.dreams', null));
});

test('members can answer the Make a Splash questions', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('splash.store'), [
            'interests' => [Interest::ANIMALS->value, Interest::TRAVEL->value],
            'dreams' => 'A piece of land, some dogs, a garden.',
            'treats' => 'A good cup of coffee',
            'about' => 'Born in Friendswood, Texas.',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('dashboard'));

    expect($user->refresh())
        ->interests->toBe(['animals', 'travel'])
        ->dreams->toBe('A piece of land, some dogs, a garden.')
        ->treats->toBe('A good cup of coffee')
        ->about->toBe('Born in Friendswood, Texas.');
});

test('every question is optional', function () {
    $user = User::factory()->withProfile()->create();

    $this->actingAs($user)
        ->post(route('splash.store'), [])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('dashboard'));

    expect($user->refresh())
        ->interests->toBe([])
        ->dreams->toBeNull()
        ->treats->toBeNull()
        ->about->toBeNull();
});

test('only known interests are accepted', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('splash.store'), ['interests' => ['music', 'not-a-real-interest']])
        ->assertSessionHasErrors('interests.1');

    expect($user->refresh()->interests)->toBeNull();
});

test('answers are limited to 1000 characters', function (string $field) {
    $this->actingAs(User::factory()->create())
        ->post(route('splash.store'), [$field => str_repeat('a', 1001)])
        ->assertSessionHasErrors($field);
})->with(['dreams', 'treats', 'about']);
