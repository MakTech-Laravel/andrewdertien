<?php

use Inertia\Testing\AssertableInertia as Assert;

it('serves the public Quantum Pond landing page', function () {
    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('pond/welcome'));
});

it('serves each public sample-data design preview', function (string $screen) {
    $this->get('/preview/'.$screen)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/preview')
            ->where('view', $screen));
})->with(['dashboard', 'feed', 'explore', 'profile', 'balls', 'connections', 'messages', 'history', 'admin']);
