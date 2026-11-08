<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PurchaseStatus;
use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\PondPurchase;
use App\Models\User;
use App\Support\LastAdmin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', ''));

        $users = User::query()
            ->with('roles:id,name')
            ->withCount(['pondPurchases as ponds_owned' => fn ($query) => $query->where('status', PurchaseStatus::PAID)])
            ->withSum(['pondPurchases as spent_cents' => fn ($query) => $query->where('status', PurchaseStatus::PAID)], 'amount_cents')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role !== '', function ($query) use ($role): void {
                $query->whereHas('roles', fn ($query) => $query->where('name', $role));
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::orderBy('name')->pluck('name'),
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            // Lets the client disable destructive actions on the last admin.
            'adminCount' => LastAdmin::count(),
            'currency' => config('payments.currency'),
            'stats' => [
                'total' => User::count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
                'buyers' => PondPurchase::query()
                    ->where('status', PurchaseStatus::PAID)
                    ->whereNotNull('user_id')
                    ->distinct()
                    ->count('user_id'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create', [
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // The User model casts `password` as `hashed`, so we pass it as-is.
        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user = User::create(collect($data)->except(['roles', 'remove_avatar'])->all());

        $user->syncRoles($request->validated('roles') ?: [RoleEnum::USER->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User created successfully.']);

        return redirect()->route('admin.users.index');
    }

    public function show(User $user): Response
    {
        $user->load('roles:id,name');

        $purchases = $user->pondPurchases()->with('pond')->latest('id')->get();
        $paid = $purchases->where('status', PurchaseStatus::PAID);

        return Inertia::render('pond/admin/member', [
            'member' => [
                ...$user->only(['id', 'name', 'email', 'username', 'location', 'email_verified_at']),
                'avatar_url' => $user->avatarUrl(),
                'roles' => $user->getRoleNames(),
                'joined_at' => $user->created_at?->toIso8601String(),
            ],
            'stats' => [
                'owned' => $paid->count(),
                'spent_cents' => (int) $paid->sum('amount_cents'),
                'payments' => $purchases->count(),
            ],
            'ownedPonds' => $paid->values()->map(fn (PondPurchase $purchase): array => [
                ...$purchase->toHistoryRow(),
                'pond' => $purchase->pond->toCard(),
            ]),
            'payments' => $purchases->map(fn (PondPurchase $purchase): array => $purchase->toHistoryRow()),
            'currency' => config('payments.currency'),
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('roles:id,name');

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => Role::orderBy('name')->get(['id', 'name']),
            'userRoles' => $user->roles->pluck('name'),
            // The last admin cannot have the role removed from the UI.
            'isLastAdmin' => LastAdmin::is($user),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        // Keep the current password when the field is left blank; the model's
        // `hashed` cast handles hashing when a new password is provided.
        if (empty($data['password'])) {
            unset($data['password']);
        }

        if ($request->hasFile('avatar')) {
            $this->deleteAvatar($user);
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar')) {
            $this->deleteAvatar($user);
            $data['avatar'] = null;
        }

        $user->update(collect($data)->except(['roles', 'remove_avatar'])->all());

        // Leaving roles out keeps the current one, so an account always has a role.
        if ($roles = $request->validated('roles')) {
            $user->syncRoles($roles);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User updated successfully.']);

        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        // Never allow the system to be left without an admin.
        if (LastAdmin::is($user)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Make another user an admin before deleting the last administrator.',
            ]);

            return redirect()->back();
        }

        $this->deleteAvatar($user);
        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User deleted successfully.']);

        return redirect()->back();
    }

    private function deleteAvatar(User $user): void
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }
    }
}
