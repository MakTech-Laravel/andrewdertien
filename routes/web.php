<?php

use App\Enums\PermissionEnum;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\PondController as AdminPondController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileUploadDemoController;
use App\Http\Controllers\Member\CheckoutController;
use App\Http\Controllers\Member\PaymentController as MemberPaymentController;
use App\Http\Controllers\Member\PondController as MemberPondController;
use App\Http\Controllers\Member\SandboxCheckoutController;
use App\Http\Controllers\MemberDirectoryController;
use App\Http\Controllers\MemberProfileController;
use App\Http\Controllers\PondCatalogController;
use App\Http\Controllers\PostAttachmentController;
use App\Http\Controllers\SplashController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Support\Facades\Route;

Route::get('/', [PondCatalogController::class, 'home'])->name('home');
Route::get('ponds', [PondCatalogController::class, 'index'])->name('ponds.index');
Route::get('ponds/{pond:slug}', [PondCatalogController::class, 'show'])->name('ponds.show');

// Step 2 of sign-up ("Make a Splash!"): new members land here straight after registering.
Route::middleware('auth')->prefix('welcome')->name('splash.')->controller(SplashController::class)->group(function () {
    Route::get('splash', 'show')->name('show');
    Route::post('splash', 'store')->name('store');
});

// Authenticated by its signature, not a session.
Route::post('webhooks/stripe', StripeWebhookController::class)->name('webhooks.stripe');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // ── Member: choosing and buying ponds ────────────────────────────────────
    Route::prefix('dashboard')->name('member.')->group(function () {
        Route::get('ponds', [MemberPondController::class, 'index'])->name('ponds.index')
            ->middleware('permission:'.PermissionEnum::MEMBER_PONDS_VIEW->value);
        Route::get('my-ponds', [MemberPondController::class, 'owned'])->name('ponds.owned')
            ->middleware('permission:'.PermissionEnum::MEMBER_PONDS_VIEW->value);
        Route::post('ponds/{pond:slug}/checkout', [CheckoutController::class, 'store'])->name('checkout.store')
            ->middleware(['permission:'.PermissionEnum::MEMBER_PONDS_PURCHASE->value, 'throttle:20,1']);
        Route::get('payments', [MemberPaymentController::class, 'index'])->name('payments.index')
            ->middleware('permission:'.PermissionEnum::MEMBER_PAYMENTS_VIEW->value);
    });

    // Where the payment provider sends the buyer back to.
    Route::prefix('payments/{purchase}')->name('payments.')->group(function () {
        Route::get('return', [CheckoutController::class, 'returned'])->name('return');
        Route::get('cancel', [CheckoutController::class, 'cancelled'])->name('cancel');
        Route::get('sandbox', [SandboxCheckoutController::class, 'show'])->name('sandbox.show');
        Route::post('sandbox', [SandboxCheckoutController::class, 'complete'])->name('sandbox.complete');
    });

    // Member app UI (sample-data design). Guests are redirected to login first.
    foreach (['dashboard', 'feed', 'explore', 'profile', 'balls', 'connections', 'messages', 'history'] as $screen) {
        Route::inertia("preview/{$screen}", 'pond/preview', ['view' => $screen])->name("preview.{$screen}");
    }

    // ── Member profiles ───────────────────────────────────────────────────────
    Route::get('explore', [MemberDirectoryController::class, 'index'])->name('members.index');
    Route::get('members/{user:username}', [MemberProfileController::class, 'show'])->name('members.show');

    Route::controller(MemberProfileController::class)->prefix('my-profile')->name('member-profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::post('avatar', 'updateAvatar')->name('avatar.update');
        Route::delete('avatar', 'destroyAvatar')->name('avatar.destroy');
    });

    // ── Demo landing page ─────────────────────────────────────────────────────
    Route::get('/file-upload-demo', [FileUploadDemoController::class, 'index'])
        ->name('file-upload-demo.index')->middleware('permission:'.PermissionEnum::FILE_UPLOAD_INDEX->value);

    // ── Single / multiple file upload (used by demos 1 & 2) ──────────────────
    Route::post('/upload', [FileUploadDemoController::class, 'store'])
        ->name('upload.store')->middleware('permission:'.PermissionEnum::FILE_UPLOAD_STORE->value);

    // ── Edit-mode endpoint (demo 3) ───────────────────────────────────────────
    Route::post('/posts/{post}', [PostAttachmentController::class, 'update'])
        ->name('posts.update')->middleware('permission:'.PermissionEnum::POSTS_EDIT->value);

    // ── Admin: access management ──────────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->group(function () {
        // Users — full CRUD with Precognition on write routes.
        Route::controller(UserController::class)->group(function () {
            Route::get('users', 'index')->name('users.index')
                ->middleware('permission:'.PermissionEnum::USERS_INDEX->value);
            Route::get('users/create', 'create')->name('users.create')
                ->middleware('permission:'.PermissionEnum::USERS_CREATE->value);
            Route::post('users', 'store')->name('users.store')
                ->middleware(['permission:'.PermissionEnum::USERS_CREATE->value, HandlePrecognitiveRequests::class]);
            Route::get('users/{user}', 'show')->name('users.show')
                ->middleware('permission:'.PermissionEnum::USERS_VIEW->value);
            Route::get('users/{user}/edit', 'edit')->name('users.edit')
                ->middleware('permission:'.PermissionEnum::USERS_EDIT->value);
            Route::put('users/{user}', 'update')->name('users.update')
                ->middleware(['permission:'.PermissionEnum::USERS_EDIT->value, HandlePrecognitiveRequests::class]);
            Route::delete('users/{user}', 'destroy')->name('users.destroy')
                ->middleware('permission:'.PermissionEnum::USERS_DELETE->value);
        });

        // Overview of ponds, members and revenue.
        Route::get('dashboard', AdminDashboardController::class)->name('dashboard')
            ->middleware('permission:'.PermissionEnum::ADMIN_DASHBOARD_VIEW->value);

        // Ponds — what exists, and where each one appears.
        Route::controller(AdminPondController::class)->group(function () {
            Route::get('ponds', 'index')->name('ponds.index')
                ->middleware('permission:'.PermissionEnum::PONDS_INDEX->value);
            Route::get('ponds/create', 'create')->name('ponds.create')
                ->middleware('permission:'.PermissionEnum::PONDS_CREATE->value);
            Route::post('ponds', 'store')->name('ponds.store')
                ->middleware('permission:'.PermissionEnum::PONDS_CREATE->value);
            Route::get('ponds/{pond}/edit', 'edit')->name('ponds.edit')
                ->middleware('permission:'.PermissionEnum::PONDS_EDIT->value);
            Route::post('ponds/{pond}', 'update')->name('ponds.update')
                ->middleware('permission:'.PermissionEnum::PONDS_EDIT->value);
            Route::patch('ponds/{pond}/visibility', 'updateVisibility')->name('ponds.visibility')
                ->middleware('permission:'.PermissionEnum::PONDS_EDIT->value);
            Route::delete('ponds/{pond}', 'destroy')->name('ponds.destroy')
                ->middleware('permission:'.PermissionEnum::PONDS_DELETE->value);
        });

        // Who bought which pond, and every payment.
        Route::controller(AdminPaymentController::class)->group(function () {
            Route::get('payments', 'index')->name('payments.index')
                ->middleware('permission:'.PermissionEnum::PAYMENTS_INDEX->value);
            Route::post('payments/{purchase}/refund', 'refund')->name('payments.refund')
                ->middleware('permission:'.PermissionEnum::PAYMENTS_REFUND->value);
        });

        // Roles — the two fixed roles and what each can do (read-only).
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index')
            ->middleware('permission:'.PermissionEnum::ROLES_INDEX->value);

        // Permissions — read-only listing + CSV / Excel export.
        Route::controller(PermissionController::class)->group(function () {
            Route::get('permissions', 'index')->name('permissions.index')
                ->middleware('permission:'.PermissionEnum::PERMISSIONS_INDEX->value);
            Route::get('permissions/export', 'export')->name('permissions.export')
                ->middleware('permission:'.PermissionEnum::PERMISSIONS_EXPORT->value);
        });
    });
});

require __DIR__.'/settings.php';
