<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PondCategory;
use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pond\StorePondRequest;
use App\Http\Requests\Pond\UpdatePondRequest;
use App\Models\Pond;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PondController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('pond/admin/ponds/index', [
            'ponds' => Pond::query()
                ->withCount(['purchases as sales' => fn ($query) => $query->where('status', PurchaseStatus::PAID)])
                ->withCount('purchases')
                ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->ordered()
                ->paginate(12)
                ->withQueryString()
                ->through(fn (Pond $pond): array => [
                    ...$pond->toCard(),
                    'is_published' => $pond->is_published,
                    'show_on_frontend' => $pond->show_on_frontend,
                    'sort_order' => $pond->sort_order,
                    'sales' => $pond->sales,
                ]),
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('pond/admin/ponds/form', $this->formProps());
    }

    public function store(StorePondRequest $request): RedirectResponse
    {
        $data = $request->pondAttributes();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('ponds', 'public');
        }

        $pond = Pond::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$pond->name} created."]);

        return redirect()->route('admin.ponds.index');
    }

    public function edit(Pond $pond): Response
    {
        return Inertia::render('pond/admin/ponds/form', [
            ...$this->formProps(),
            'pond' => [
                ...$pond->toCard(),
                'ball_value' => $pond->ball_value,
                'has_custom_image' => $pond->image !== null,
                'is_published' => $pond->is_published,
                'show_on_frontend' => $pond->show_on_frontend,
                'sort_order' => $pond->sort_order,
            ],
        ]);
    }

    public function update(UpdatePondRequest $request, Pond $pond): RedirectResponse
    {
        $data = $request->pondAttributes();

        if ($request->hasFile('image')) {
            $this->deleteImage($pond);
            $data['image'] = $request->file('image')->store('ponds', 'public');
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($pond);
            $data['image'] = null;
        }

        $pond->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$pond->name} updated."]);

        return redirect()->route('admin.ponds.index');
    }

    /**
     * Choose where a pond appears without opening its form. Showing a pond on the
     * website publishes it, and unpublishing a pond takes it off the website.
     */
    public function updateVisibility(Request $request, Pond $pond): RedirectResponse
    {
        $data = $request->validate([
            'is_published' => ['sometimes', 'boolean'],
            'show_on_frontend' => ['sometimes', 'boolean'],
        ]);

        $pond->fill($data);

        if ($request->boolean('show_on_frontend')) {
            $pond->is_published = true;
        }

        if (! $pond->is_published) {
            $pond->show_on_frontend = false;
        }

        $pond->save();

        return redirect()->back();
    }

    /**
     * Soft delete, so purchase history keeps pointing at the pond. Existing owners
     * keep it; it simply can no longer be found or bought.
     */
    public function destroy(Pond $pond): RedirectResponse
    {
        $pond->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$pond->name} deleted."]);

        return redirect()->back();
    }

    /**
     * @return array{categories: array<int, array{value: string, label: string}>, ballValues: list<int>, currency: string}
     */
    private function formProps(): array
    {
        return [
            'categories' => array_map(
                fn (PondCategory $category): array => ['value' => $category->value, 'label' => $category->label()],
                PondCategory::cases(),
            ),
            'ballValues' => Pond::BALL_VALUES,
            'currency' => config('payments.currency'),
        ];
    }

    private function deleteImage(Pond $pond): void
    {
        if ($pond->image) {
            Storage::disk('public')->delete($pond->image);
        }
    }
}
