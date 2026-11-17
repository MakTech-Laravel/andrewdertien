<?php

namespace App\Http\Requests\Payment;

use App\Models\PaymentSetting;
use App\Support\Payments\StripeSettings;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateStripeSettingsRequest extends FormRequest
{
    /**
     * A blank key field means "keep the key that is already saved".
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'stripe_enabled' => ['required', 'boolean'],
            'stripe_publishable_key' => ['nullable', 'string', 'max:255', 'regex:/^pk_(test|live)_[A-Za-z0-9]+$/'],
            'stripe_secret_key' => ['nullable', 'string', 'max:255', 'regex:/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/'],
            'stripe_webhook_secret' => ['nullable', 'string', 'max:255', 'regex:/^whsec_[A-Za-z0-9]+$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'stripe_publishable_key.regex' => 'This does not look like a Stripe publishable key. It starts with pk_test_ or pk_live_.',
            'stripe_secret_key.regex' => 'This does not look like a Stripe secret key. It starts with sk_test_ or sk_live_.',
            'stripe_webhook_secret.regex' => 'This does not look like a Stripe webhook signing secret. It starts with whsec_.',
        ];
    }

    /**
     * The keys must belong together, and Stripe cannot be switched on without them.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $saved = PaymentSetting::query()->first();
            $secret = $this->filled('stripe_secret_key') ? $this->string('stripe_secret_key')->toString() : $saved?->stripe_secret_key;
            $publishable = $this->filled('stripe_publishable_key') ? $this->string('stripe_publishable_key')->toString() : $saved?->stripe_publishable_key;
            $webhook = $this->filled('stripe_webhook_secret') ? $this->string('stripe_webhook_secret')->toString() : $saved?->stripe_webhook_secret;

            if ($this->boolean('stripe_enabled')) {
                if (blank($secret)) {
                    $validator->errors()->add('stripe_secret_key', 'Enter your Stripe secret key before switching Stripe on.');
                }

                if (blank($webhook)) {
                    $validator->errors()->add('stripe_webhook_secret', 'Enter your Stripe webhook signing secret before switching Stripe on. Without it payments cannot be confirmed.');
                }
            }

            $secretMode = StripeSettings::modeOf($secret);
            $publishableMode = StripeSettings::modeOf($publishable);

            if ($secretMode !== null && $publishableMode !== null && $secretMode !== $publishableMode) {
                $validator->errors()->add('stripe_publishable_key', "The publishable key is a {$publishableMode} key but the secret key is a {$secretMode} key. Use keys from the same mode.");
            }
        }];
    }
}
