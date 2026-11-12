<?php

namespace App\Http\Controllers;

use App\Enums\Interest;
use App\Http\Requests\MemberProfile\UpdateAvatarRequest;
use App\Http\Requests\MemberProfile\UpdateMemberProfileRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MemberProfileController extends Controller
{
    /**
     * Show a member's public profile: basic details plus Dreams, Fun, Treats and Boost.
     */
    public function show(Request $request, User $user): Response
    {
        $viewer = $request->user();
        $isOwnProfile = $viewer->is($user);

        return Inertia::render('pond/member', [
            'member' => $user->toPublicProfile(),
            'isOwnProfile' => $isOwnProfile,
            'canSendSparkBall' => ! $isOwnProfile && $user->isOpenToRomance() && $viewer->isAdult(),
        ]);
    }

    /**
     * Show the signed-in member's profile editor.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('pond/profile-edit', [
            'interestOptions' => Interest::options(),
            'profile' => [
                ...$user->toPublicProfile(),
                'open_to_romance' => $user->open_to_romance,
                'has_date_of_birth' => $user->date_of_birth !== null,
                'is_adult' => $user->isAdult(),
            ],
        ]);
    }

    /**
     * Save the signed-in member's profile details.
     */
    public function update(UpdateMemberProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($user->date_of_birth !== null || empty($data['date_of_birth'])) {
            unset($data['date_of_birth']);
        }

        $data['interests'] = array_values($data['interests'] ?? []);

        $user->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile saved.')]);

        return to_route('member-profile.edit');
    }

    /**
     * Replace the signed-in member's profile picture.
     */
    public function updateAvatar(UpdateAvatarRequest $request): RedirectResponse
    {
        $user = $request->user();
        $previousAvatar = $user->avatar;

        $user->update([
            'avatar' => $request->file('avatar')->store('avatars', 'public'),
        ]);

        $this->deleteStoredAvatar($previousAvatar);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile picture updated.')]);

        return to_route('member-profile.edit');
    }

    /**
     * Remove the signed-in member's profile picture.
     */
    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        $this->deleteStoredAvatar($user->avatar);
        $user->update(['avatar' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile picture removed.')]);

        return to_route('member-profile.edit');
    }

    /**
     * Delete an uploaded avatar file; external URLs are left alone.
     */
    private function deleteStoredAvatar(?string $path): void
    {
        if ($path && ! str_starts_with($path, 'http')) {
            Storage::disk('public')->delete($path);
        }
    }
}
