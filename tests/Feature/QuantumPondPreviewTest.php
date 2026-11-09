<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('serves the public Ask Upon A Pond landing page', function () {
    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('pond/welcome'));
});

it('ships the Ask Upon A Pond favicon and lotus mark', function () {
    expect(file_exists(public_path('favicon.svg')))->toBeTrue()
        ->and(file_exists(public_path('askupon/lotus.svg')))->toBeTrue()
        ->and(file_exists(public_path('apple-touch-icon.png')))->toBeTrue();
});

it('includes the three.js dependency for pond animations', function () {
    $package = json_decode((string) file_get_contents(base_path('package.json')), true);

    expect($package['dependencies']['three'] ?? null)->not->toBeNull();
});

it('ships the real photos and golf balls the landing page needs', function () {
    expect(file_exists(public_path('askupon/scene-sunrise.jpg')))->toBeTrue()
        ->and(file_exists(public_path('askupon/pond-reeds-sunset.jpg')))->toBeTrue()
        ->and(file_exists(public_path('askupon/golf-course-sunset.jpg')))->toBeTrue()
        ->and(file_exists(public_path('askupon/balls/golf-white.svg')))->toBeTrue();
});

it('does not use 3D anywhere in the website code', function () {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/pages'), FilesystemIterator::SKIP_DOTS));

    foreach ($files as $file) {
        expect(file_get_contents($file->getPathname()))->not->toContain("from 'three'");
    }

    $components = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path('js/components'), FilesystemIterator::SKIP_DOTS));

    foreach ($components as $file) {
        expect(file_get_contents($file->getPathname()))->not->toContain("from 'three'");
    }
});

it('redirects guests from the dashboard to login', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
});

it('redirects guests from member preview screens to login', function (string $screen) {
    $this->get('/preview/'.$screen)->assertRedirect(route('login'));
})->with(['dashboard', 'feed', 'explore', 'profile', 'balls', 'connections', 'messages', 'history']);

it('lets authenticated members open the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pond/member/dashboard'));
});

it('no longer has a public admin preview screen', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/preview/admin')->assertNotFound();
});

it('lets authenticated members open each member preview screen', function (string $screen) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/preview/'.$screen)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/preview')
            ->where('view', $screen));
})->with(['dashboard', 'feed', 'explore', 'profile', 'balls', 'connections', 'messages', 'history']);
