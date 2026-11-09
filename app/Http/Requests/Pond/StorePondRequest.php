<?php

namespace App\Http\Requests\Pond;

use App\Enums\PondCategory;
use App\Models\Pond;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePondRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['required', Rule::enum(PondCategory::class)],
            // Stripe's lowest charge is 50 cents.
            'price' => ['required', 'numeric', 'min:0.5', 'max:1000000', 'decimal:0,2'],
            'ball_art' => ['required', 'string', Rule::in(array_keys(Pond::artwork()))],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
            'show_on_frontend' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ];
    }

    /**
     * The validated input as model attributes. A pond can only be on the website
     * while it is published.
     *
     * @return array<string, mixed>
     */
    public function pondAttributes(): array
    {
        $isPublished = $this->boolean('is_published');

        return [
            'name' => $this->validated('name'),
            'tagline' => $this->validated('tagline'),
            'description' => $this->validated('description'),
            'category' => $this->validated('category'),
            'price_cents' => (int) round(((float) $this->validated('price')) * 100),
            'ball_art' => $this->validated('ball_art'),
            'is_published' => $isPublished,
            'show_on_frontend' => $isPublished && $this->boolean('show_on_frontend'),
            'sort_order' => (int) $this->validated('sort_order', 0),
        ];
    }
}
