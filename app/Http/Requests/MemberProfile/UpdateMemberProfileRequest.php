<?php

namespace App\Http\Requests\MemberProfile;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberProfileRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->memberProfileRules($this->user(), $this->input('date_of_birth'));
    }

    /**
     * Normalise the checkbox so an unchecked box is stored as "not open".
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'open_to_romance' => $this->boolean('open_to_romance'),
        ]);
    }
}
