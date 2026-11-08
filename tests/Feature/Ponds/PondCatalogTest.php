<?php

use App\Enums\RoleEnum;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the website only shows ponds the admin chose', function () {
    $shown = Pond::factory()->create(['name' => 'Shown Pond']);
    Pond::factory()->hiddenFromFrontend()->create();
    Pond::factory()->draft()->create();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/welcome')
            ->has('ponds', 1)
            ->where('ponds.0.id', $shown->id)
        );

    $this->get(route('ponds.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/ponds/index')
            ->has('ponds', 1)
            ->where('ponds.0.name', 'Shown Pond')
        );
});

test('ponds appear in the order the admin set', function () {
    $second = Pond::factory()->create(['sort_order' => 2]);
    $first = Pond::factory()->create(['sort_order' => 1]);

    $this->get(route('ponds.index'))->assertInertia(fn (Assert $page) => $page
        ->where('ponds.0.id', $first->id)
        ->where('ponds.1.id', $second->id)
    );
});

test('a pond page is public while the pond is on the website', function () {
    $pond = Pond::factory()->create();

    $this->get(route('ponds.show', $pond->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/ponds/show')
            ->where('pond.slug', $pond->slug)
            ->where('isOwned', false)
        );
});

test('hidden, draft and deleted ponds have no public page', function () {
    $hidden = Pond::factory()->hiddenFromFrontend()->create();
    $draft = Pond::factory()->draft()->create();
    $deleted = Pond::factory()->create();
    $deleted->delete();

    $this->get(route('ponds.show', $hidden->slug))->assertNotFound();
    $this->get(route('ponds.show', $draft->slug))->assertNotFound();
    $this->get(route('ponds.show', $deleted->slug))->assertNotFound();
});

test('a pond page tells an owner they own it', function () {
    $purchase = PondPurchase::factory()->paid()->create();

    $this->actingAs($purchase->user)
        ->get(route('ponds.show', $purchase->pond->slug))
        ->assertInertia(fn (Assert $page) => $page->where('isOwned', true));
});

test('members can choose published ponds that are hidden from the website, but not drafts', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::USER->value);

    $hidden = Pond::factory()->hiddenFromFrontend()->create();
    Pond::factory()->draft()->create();

    $this->actingAs($user)
        ->get(route('member.ponds.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/member/ponds')
            ->has('ponds', 1)
            ->where('ponds.0.id', $hidden->id)
        );
});

test('members can filter ponds by category', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::USER->value);

    $fun = Pond::factory()->create(['category' => 'fun']);
    Pond::factory()->create(['category' => 'boost']);

    $this->actingAs($user)
        ->get(route('member.ponds.index', ['category' => 'fun']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('ponds', 1)
            ->where('ponds.0.id', $fun->id)
            ->where('filters.category', 'fun')
        );
});
