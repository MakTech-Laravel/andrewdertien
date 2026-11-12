<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function profilePayload(User $user, array $overrides = []): array
{
    return [
        'name' => $user->name,
        'username' => $user->username,
        'location' => null,
        'dreams' => null,
        'fun' => null,
        'treats' => null,
        'boost' => null,
        ...$overrides,
    ];
}

test('guests are redirected away from member pages', function (string $url) {
    $this->get($url)->assertRedirect(route('login'));
})->with(['/my-profile', '/explore', '/members/someone']);

test('the profile editor shows the member their own details', function () {
    $user = User::factory()->withProfile()->create();

    $this->actingAs($user)
        ->get(route('member-profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/profile-edit')
            ->where('profile.username', $user->username)
            ->where('profile.dreams', $user->dreams)
            ->where('profile.has_date_of_birth', false)
            ->missing('profile.email'));
});

test('members can save their basics and all four sections', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, [
            'name' => 'Sunny Day',
            'username' => 'sunny_day',
            'location' => 'San Francisco',
            'dreams' => 'Open a little bakery.',
            'fun' => 'Surfing at Ocean Beach.',
            'treats' => 'A flat white.',
            'boost' => 'Help with groceries this month.',
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('member-profile.edit'));

    expect($user->refresh())
        ->name->toBe('Sunny Day')
        ->username->toBe('sunny_day')
        ->location->toBe('San Francisco')
        ->dreams->toBe('Open a little bakery.')
        ->fun->toBe('Surfing at Ocean Beach.')
        ->treats->toBe('A flat white.')
        ->boost->toBe('Help with groceries this month.');
});

test('every profile section may be left blank', function () {
    $user = User::factory()->withProfile()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user))
        ->assertSessionHasNoErrors();

    expect($user->refresh())
        ->dreams->toBeNull()
        ->fun->toBeNull()
        ->treats->toBeNull()
        ->boost->toBeNull()
        ->location->toBeNull();
});

test('usernames must be unique and use only letters, numbers and underscores', function (string $username) {
    User::factory()->create(['username' => 'taken_name']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, ['username' => $username]))
        ->assertSessionHasErrors('username');
})->with(['taken_name', 'has space', 'dots.not.allowed', 'ab', '']);

test('romantic connections is off by default', function () {
    expect(User::factory()->create()->refresh()->open_to_romance)->toBeFalse();
});

test('an adult can opt in to romantic connections by giving their date of birth', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, [
            'open_to_romance' => '1',
            'date_of_birth' => now()->subYears(25)->toDateString(),
        ]))
        ->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->open_to_romance)->toBeTrue()
        ->and($user->isOpenToRomance())->toBeTrue();
});

test('opting in to romantic connections requires a date of birth', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, ['open_to_romance' => '1']))
        ->assertSessionHasErrors(['date_of_birth', 'open_to_romance']);

    expect($user->refresh()->open_to_romance)->toBeFalse();
});

test('members under 18 cannot opt in to romantic connections', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, [
            'open_to_romance' => '1',
            'date_of_birth' => now()->subYears(17)->toDateString(),
        ]))
        ->assertSessionHasErrors('open_to_romance');

    expect($user->refresh()->open_to_romance)->toBeFalse();
});

test('a saved date of birth cannot be changed', function () {
    $user = User::factory()->create(['date_of_birth' => now()->subYears(16)->toDateString()]);

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, [
            'open_to_romance' => '1',
            'date_of_birth' => now()->subYears(30)->toDateString(),
        ]))
        ->assertSessionHasErrors(['date_of_birth', 'open_to_romance']);
});

test('members can switch romantic connections off at any time', function () {
    $user = User::factory()->openToRomance()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user))
        ->assertSessionHasNoErrors();

    expect($user->refresh()->open_to_romance)->toBeFalse();
});

test('members can upload, replace and remove a profile picture', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('member-profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me.jpg')])
        ->assertSessionHasNoErrors();

    $first = $user->refresh()->avatar;
    Storage::disk('public')->assertExists($first);

    $this->actingAs($user)
        ->post(route('member-profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me-again.png')])
        ->assertSessionHasNoErrors();

    $second = $user->refresh()->avatar;
    Storage::disk('public')->assertMissing($first);
    Storage::disk('public')->assertExists($second);

    $this->actingAs($user)->delete(route('member-profile.avatar.destroy'))->assertRedirect();

    expect($user->refresh()->avatar)->toBeNull();
    Storage::disk('public')->assertMissing($second);
});

test('profile pictures must be images', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('member-profile.avatar.update'), ['avatar' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')])
        ->assertSessionHasErrors('avatar');
});

test('members can view another member\'s public profile without private details', function () {
    $viewer = User::factory()->create();
    $member = User::factory()->withProfile()->create(['date_of_birth' => now()->subYears(40)->toDateString()]);

    $this->actingAs($viewer)
        ->get(route('members.show', $member->username))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/member')
            ->where('member.username', $member->username)
            ->where('member.dreams', $member->dreams)
            ->where('member.boost', $member->boost)
            ->where('member.open_to_romance', false)
            ->where('isOwnProfile', false)
            ->where('canSendSparkBall', false)
            ->missing('member.email')
            ->missing('member.date_of_birth'));
});

test('the heart and spark ball option only appear for adults who opted in', function () {
    $adultViewer = User::factory()->create(['date_of_birth' => now()->subYears(30)->toDateString()]);
    $minorViewer = User::factory()->create(['date_of_birth' => now()->subYears(15)->toDateString()]);
    $member = User::factory()->openToRomance()->create();

    $this->actingAs($adultViewer)
        ->get(route('members.show', $member->username))
        ->assertInertia(fn (Assert $page) => $page
            ->where('member.open_to_romance', true)
            ->where('canSendSparkBall', true));

    $this->actingAs($minorViewer)
        ->get(route('members.show', $member->username))
        ->assertInertia(fn (Assert $page) => $page->where('canSendSparkBall', false));

    $this->actingAs($member)
        ->get(route('members.show', $member->username))
        ->assertInertia(fn (Assert $page) => $page
            ->where('isOwnProfile', true)
            ->where('canSendSparkBall', false));
});

test('unknown usernames return not found', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('members.show', 'nobody_here'))
        ->assertNotFound();
});

test('explore lists members and supports search and section filters', function () {
    $viewer = User::factory()->create(['username' => 'viewer']);
    User::factory()->create(['username' => 'baker_bea', 'location' => 'Oakland', 'dreams' => 'A bakery.']);
    User::factory()->create(['username' => 'surfer_sam', 'location' => 'Santa Cruz', 'fun' => 'Surfing.']);
    User::factory()->create(['username' => null]);

    $this->actingAs($viewer)
        ->get(route('members.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/explore')
            ->has('members.data', 3));

    $this->actingAs($viewer)
        ->get(route('members.index', ['search' => 'oakland']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('members.data', 1)
            ->where('members.data.0.username', 'baker_bea'));

    $this->actingAs($viewer)
        ->get(route('members.index', ['category' => 'fun']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('members.data', 1)
            ->where('members.data.0.username', 'surfer_sam')
            ->where('filters.category', 'fun'));
});

test('explore rejects unknown section filters', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('members.index', ['category' => 'secrets']))
        ->assertSessionHasErrors('category');
});

test('members can choose their interests and share more about themselves', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, [
            'interests' => ['gaming', 'music', 'giving-back'],
            'about' => 'Collector of golf balls.',
        ]))
        ->assertSessionHasNoErrors();

    expect($user->refresh())
        ->interests->toBe(['gaming', 'music', 'giving-back'])
        ->about->toBe('Collector of golf balls.');
});

test('interests can be cleared and unknown ones are rejected', function () {
    $user = User::factory()->withProfile()->create();

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user, ['interests' => ['made-up']]))
        ->assertSessionHasErrors('interests.0');

    $this->actingAs($user)
        ->patch(route('member-profile.update'), profilePayload($user))
        ->assertSessionHasNoErrors();

    expect($user->refresh()->interests)->toBe([]);
});

test('the profile editor and public profile expose interests with their labels', function () {
    $member = User::factory()->create(['interests' => ['food-and-coffee', 'nature-and-outdoors'], 'about' => 'Hello pond.']);

    $this->actingAs($member)
        ->get(route('member-profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/profile-edit')
            ->has('interestOptions', 10)
            ->where('profile.interest_values', ['food-and-coffee', 'nature-and-outdoors'])
            ->where('profile.about', 'Hello pond.'));

    $this->actingAs(User::factory()->create())
        ->get(route('members.show', $member->username))
        ->assertInertia(fn (Assert $page) => $page
            ->where('member.interests', [
                ['value' => 'food-and-coffee', 'label' => 'Food & Coffee'],
                ['value' => 'nature-and-outdoors', 'label' => 'Nature & Outdoors'],
            ])
            ->where('member.about', 'Hello pond.'));
});
