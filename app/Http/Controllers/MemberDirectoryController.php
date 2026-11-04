<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MemberDirectoryController extends Controller
{
    /**
     * Browse members, optionally searching by name/username/city or
     * narrowing to people who have shared a particular profile section.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::in(User::PROFILE_CATEGORIES)],
        ]);

        $search = $filters['search'] ?? null;
        $category = $filters['category'] ?? null;

        $members = User::query()
            ->discoverable()
            ->when($search, function (Builder $query, string $search): void {
                $term = '%'.addcslashes($search, '%_\\').'%';

                $query->where(fn (Builder $query) => $query
                    ->where('name', 'like', $term)
                    ->orWhere('username', 'like', $term)
                    ->orWhere('location', 'like', $term));
            })
            ->when($category, fn (Builder $query, string $category) => $query
                ->whereNotNull($category)
                ->where($category, '!=', ''))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $member) => $member->toPublicProfile());

        return Inertia::render('pond/explore', [
            'members' => $members,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? '',
            ],
        ]);
    }
}
