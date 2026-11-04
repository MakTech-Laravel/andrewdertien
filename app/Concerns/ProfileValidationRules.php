<?php

namespace App\Concerns;

use App\Models\User;
use Carbon\Exceptions\InvalidFormatException;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules for the member-facing Quantum Pond profile.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string|Closure>>
     */
    protected function memberProfileRules(User $user, mixed $submittedDateOfBirth): array
    {
        $categoryRules = ['nullable', 'string', 'max:1000'];

        return [
            'name' => $this->nameRules(),
            'username' => $this->usernameRules($user->id),
            'location' => ['nullable', 'string', 'max:100'],
            'dreams' => $categoryRules,
            'fun' => $categoryRules,
            'treats' => $categoryRules,
            'boost' => $categoryRules,
            'date_of_birth' => $user->date_of_birth === null
                ? $this->dateOfBirthRules()
                : ['prohibited'],
            'open_to_romance' => $this->romanceRules($user->date_of_birth ?? $submittedDateOfBirth),
        ];
    }

    /**
     * Get the validation rules used to validate usernames.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function usernameRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'min:3',
            'max:30',
            'regex:/^[A-Za-z0-9_]+$/',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Date of birth is only needed when a member opts in to Romantic Connections.
     *
     * @return array<int, string>
     */
    protected function dateOfBirthRules(): array
    {
        return ['nullable', 'date', 'before:today', 'after:1900-01-01', 'required_if_accepted:open_to_romance'];
    }

    /**
     * Romantic Connections can only be switched on by members aged 18 or older.
     *
     * @return array<int, string|Closure>
     */
    protected function romanceRules(mixed $dateOfBirth): array
    {
        return [
            'boolean',
            function (string $attribute, mixed $value, Closure $fail) use ($dateOfBirth): void {
                if (! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                    return;
                }

                try {
                    $age = $dateOfBirth ? Carbon::parse($dateOfBirth)->age : null;
                } catch (InvalidFormatException) {
                    $age = null;
                }

                if ($age === null || $age < User::ROMANCE_MINIMUM_AGE) {
                    $fail(__('You must be :age or older to be open to romantic connections.', ['age' => User::ROMANCE_MINIMUM_AGE]));
                }
            },
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
