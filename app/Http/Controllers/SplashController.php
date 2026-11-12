<?php

namespace App\Http\Controllers;

use App\Enums\Interest;
use App\Http\Requests\MemberProfile\SaveSplashRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Step 2 of sign-up, "Make a Splash!": a few optional questions about the new member.
 */
class SplashController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('auth/splash', [
            'interestOptions' => Interest::options(),
            'profile' => [
                'interests' => $user->interests ?? [],
                'dreams' => $user->dreams,
                'treats' => $user->treats,
                'about' => $user->about,
            ],
        ]);
    }

    public function store(SaveSplashRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $request->user()->update([
            'interests' => array_values($data['interests'] ?? []),
            'dreams' => $data['dreams'] ?? null,
            'treats' => $data['treats'] ?? null,
            'about' => $data['about'] ?? null,
        ]);

        return redirect()->route('dashboard');
    }
}
