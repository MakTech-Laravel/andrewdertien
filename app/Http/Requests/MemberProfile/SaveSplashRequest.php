<?php

namespace App\Http\Requests\MemberProfile;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveSplashRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Every question in "Make a Splash!" is optional.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->interestRules(),
            'dreams' => ['nullable', 'string', 'max:1000'],
            'treats' => ['nullable', 'string', 'max:1000'],
            'about' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
