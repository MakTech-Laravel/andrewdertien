<?php

use App\Enums\PondCategory;
use App\Enums\RoleEnum;
use App\Models\Pond;
use App\Models\PondPurchase;
use App\Models\User;
use Database\Seeders\PondSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole(RoleEnum::ADMIN->value);

    $this->member = User::factory()->create();
    $this->member->assignRole(RoleEnum::USER->value);
});

function validPondInput(array $overrides = []): array
{
    return [
        'name' => 'Moonlight Pond',
        'tagline' => 'Quiet water',
        'description' => 'A calm place.',
        'category' => PondCategory::DREAMS->value,
        'price' => '49.99',
        'ball_art' => 'golf-blue',
        'is_published' => '1',
        'show_on_frontend' => '1',
        'sort_order' => 2,
        ...$overrides,
    ];
}

test('an admin can create a pond', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.ponds.store'), validPondInput())
        ->assertRedirect(route('admin.ponds.index'));

    $pond = Pond::sole();

    expect($pond->name)->toBe('Moonlight Pond')
        ->and($pond->slug)->toBe('moonlight-pond')
        ->and($pond->price_cents)->toBe(4999)
        ->and($pond->is_published)->toBeTrue()
        ->and($pond->show_on_frontend)->toBeTrue();
});

test('ponds with the same name get different slugs', function () {
    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput());
    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput());

    expect(Pond::pluck('slug')->all())->toBe(['moonlight-pond', 'moonlight-pond-2']);
});

test('a pond needs valid details', function (array $input, string $field) {
    $this->actingAs($this->admin)
        ->post(route('admin.ponds.store'), validPondInput($input))
        ->assertSessionHasErrors($field);

    expect(Pond::count())->toBe(0);
})->with([
    'no name' => [['name' => ''], 'name'],
    'unknown category' => [['category' => 'nope'], 'category'],
    'price below the minimum charge' => [['price' => '0.10'], 'price'],
    'price with too many decimals' => [['price' => '10.999'], 'price'],
    'ball without artwork' => [['ball_art' => 'golf-plaid'], 'ball_art'],
]);

test('an unpublished pond can never be on the website', function () {
    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput(['is_published' => '0', 'show_on_frontend' => '1']));

    expect(Pond::sole()->show_on_frontend)->toBeFalse();
});

test('an admin can upload and remove a pond picture', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput([
        'image' => UploadedFile::fake()->image('pond.jpg'),
    ]));

    $pond = Pond::sole();
    Storage::disk('public')->assertExists($pond->image);
    $path = $pond->image;

    $this->actingAs($this->admin)->post(route('admin.ponds.update', $pond), validPondInput(['remove_image' => '1']));

    Storage::disk('public')->assertMissing($path);
    expect($pond->fresh()->image)->toBeNull();
});

test('uploading a new pond picture replaces the old file and shows on the card', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput([
        'image' => UploadedFile::fake()->image('first.jpg'),
    ]));

    $pond = Pond::sole();
    $firstPath = $pond->image;

    expect($pond->toCard()['image_url'])->toContain($firstPath);

    $this->actingAs($this->admin)->post(route('admin.ponds.update', $pond), validPondInput([
        'image' => UploadedFile::fake()->image('second.png'),
    ]));

    $pond->refresh();

    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($pond->image);
    expect($pond->image)->not->toBe($firstPath);
});

test('choosing a ball again removes the uploaded picture', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)->post(route('admin.ponds.store'), validPondInput([
        'image' => UploadedFile::fake()->image('pond.jpg'),
    ]));

    $pond = Pond::sole();

    $this->actingAs($this->admin)->post(route('admin.ponds.update', $pond), validPondInput([
        'ball_art' => 'marble-500',
        'remove_image' => '1',
    ]));

    expect($pond->fresh()->toCard()['image_url'])->toBe('/quantum/images/ball-500.png');
});

test('every golf ball and marble has its artwork file', function () {
    foreach (Pond::artwork() as $key => $url) {
        expect(file_exists(public_path($url)))->toBeTrue("Missing artwork for {$key}");
    }
});

test('each category has its own golf ball, which starter ponds use', function () {
    $this->seed(PondSeeder::class);

    $balls = array_map(fn (PondCategory $category): string => $category->golfBall(), PondCategory::cases());

    expect(array_unique($balls))->toHaveCount(count(PondCategory::cases()))
        ->and(array_diff($balls, array_keys(Pond::artwork())))->toBe([])
        ->and(Pond::where('category', 'fun')->first()->toCard()['image_url'])->toBe('/askupon/balls/golf-sky.png');
});

test('the artwork migration moves existing ponds onto their category golf ball', function () {
    $pond = Pond::factory()->create(['category' => PondCategory::TREATS, 'ball_art' => 'marble-100']);

    $migration = require database_path('migrations/2026_11_09_100000_replace_pond_ball_value_with_ball_art.php');
    $migration->down();
    $migration->up();

    expect($pond->fresh()->ball_art)->toBe('golf-orange');
});

test('only images within the size limit can be uploaded', function (UploadedFile $file) {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->post(route('admin.ponds.store'), validPondInput(['image' => $file]))
        ->assertSessionHasErrors('image');

    expect(Pond::count())->toBe(0);
})->with([
    'not an image' => fn () => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
    'too large' => fn () => UploadedFile::fake()->image('huge.jpg')->size(5000),
]);

test('the members list shows how many members have bought a pond', function () {
    PondPurchase::factory()->paid()->count(2)->create(['user_id' => $this->member->id]);
    PondPurchase::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('stats.buyers', 1));
});

test('an admin can edit a pond without changing its link', function () {
    $pond = Pond::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

    $this->actingAs($this->admin)
        ->post(route('admin.ponds.update', $pond), validPondInput(['name' => 'New Name', 'price' => '10']))
        ->assertRedirect(route('admin.ponds.index'));

    expect($pond->fresh())
        ->name->toBe('New Name')
        ->slug->toBe('old-name')
        ->price_cents->toBe(1000);
});

test('an admin chooses which ponds show on the website', function () {
    $pond = Pond::factory()->hiddenFromFrontend()->create();

    $this->actingAs($this->admin)->patch(route('admin.ponds.visibility', $pond), ['show_on_frontend' => true])->assertRedirect();
    expect($pond->fresh()->show_on_frontend)->toBeTrue();

    $this->actingAs($this->admin)->patch(route('admin.ponds.visibility', $pond), ['show_on_frontend' => false])->assertRedirect();
    expect($pond->fresh())->show_on_frontend->toBeFalse()->is_published->toBeTrue();
});

test('showing a draft on the website publishes it, and unpublishing takes it off', function () {
    $pond = Pond::factory()->draft()->create();

    $this->actingAs($this->admin)->patch(route('admin.ponds.visibility', $pond), ['show_on_frontend' => true]);
    expect($pond->fresh())->is_published->toBeTrue()->show_on_frontend->toBeTrue();

    $this->actingAs($this->admin)->patch(route('admin.ponds.visibility', $pond), ['is_published' => false]);
    expect($pond->fresh())->is_published->toBeFalse()->show_on_frontend->toBeFalse();
});

test('deleting a pond keeps its purchase history', function () {
    $purchase = PondPurchase::factory()->paid()->create();
    $pond = $purchase->pond;

    $this->actingAs($this->admin)->delete(route('admin.ponds.destroy', $pond))->assertRedirect();

    expect(Pond::find($pond->id))->toBeNull()
        ->and($purchase->fresh()->pond->name)->toBe($pond->name);
});

test('the admin dashboard adds up sales', function () {
    $pond = Pond::factory()->create(['price_cents' => 2500]);
    PondPurchase::factory()->paid()->count(2)->create(['pond_id' => $pond->id]);
    PondPurchase::factory()->create(['pond_id' => $pond->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/admin/dashboard')
            ->where('stats.revenue_cents', 5000)
            ->where('stats.purchases', 2)
            ->where('topPonds.0.sales', 2)
            ->where('revenueByMonth.5.revenue_cents', 5000)
            ->has('recentPayments', 3)
            ->where('gateway.is_test_mode', true)
        );
});

test('an admin is sent from the shared dashboard to the admin dashboard', function () {
    $this->actingAs($this->admin)->get(route('dashboard'))->assertRedirect(route('admin.dashboard'));
});

test('an admin sees who bought what from a member page', function () {
    $purchase = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id]);
    PondPurchase::factory()->create(['user_id' => $this->member->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.users.show', $this->member))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pond/admin/member')
            ->where('member.id', $this->member->id)
            ->where('stats.owned', 1)
            ->where('stats.spent_cents', $purchase->amount_cents)
            ->has('ownedPonds', 1)
            ->has('payments', 2)
        );
});

test('the users list shows what each member has bought', function () {
    $purchase = PondPurchase::factory()->paid()->create(['user_id' => $this->member->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['search' => $this->member->email]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data.0.ponds_owned', 1)
            ->where('users.data.0.spent_cents', $purchase->amount_cents)
        );
});

test('members and guests cannot reach the admin area', function (string $method, string $routeName, bool $needsPond) {
    $pond = Pond::factory()->create();
    $url = route($routeName, $needsPond ? $pond : []);

    $this->actingAs($this->member)->call($method, $url)->assertForbidden();

    auth()->logout();
    $this->call($method, $url)->assertRedirect(route('login'));

    expect($pond->fresh()->trashed())->toBeFalse();
})->with([
    ['GET', 'admin.dashboard', false],
    ['GET', 'admin.ponds.index', false],
    ['GET', 'admin.ponds.create', false],
    ['POST', 'admin.ponds.store', false],
    ['GET', 'admin.ponds.edit', true],
    ['POST', 'admin.ponds.update', true],
    ['PATCH', 'admin.ponds.visibility', true],
    ['DELETE', 'admin.ponds.destroy', true],
    ['GET', 'admin.payments.index', false],
    ['GET', 'admin.users.index', false],
]);
