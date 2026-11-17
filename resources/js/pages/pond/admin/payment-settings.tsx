import { Head, router, useForm } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Copy, FlaskConical, KeyRound, PlugZap, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { paymentModeText } from '@/components/pond/payment-mode';
import type { PaymentMode } from '@/components/pond/payment-mode';
import { Modal, PondShell } from '@/components/pond/ui';
import adminStripe from '@/routes/admin/stripe';

type Props = {
    stripe: {
        enabled: boolean;
        source: 'dashboard' | 'environment' | 'none';
        mode: 'test' | 'live' | null;
        publishable_key: string | null;
        secret_key_hint: string | null;
        webhook_secret_hint: string | null;
    };
    gateway: { driver: string; mode: PaymentMode; is_test_mode: boolean; is_ready: boolean };
    webhook: { url: string; events: string[] };
    canEdit: boolean;
};

/** The mode a Stripe key belongs to, judged by its prefix, as the server does. */
function modeOfKey(key: string): 'test' | 'live' | null {
    if (/^(sk|rk|pk)_test_/.test(key)) {
        return 'test';
    }

    return /^(sk|rk|pk)_live_/.test(key) ? 'live' : null;
}

function FieldError({ message }: { message?: string }) {
    return message ? <p className="pd-field-error">{message}</p> : null;
}

function ModeStatus({ gateway }: { gateway: Props['gateway'] }) {
    const text = paymentModeText[gateway.mode];

    if (gateway.mode === 'live' && gateway.is_ready) {
        return (
            <div className="pd-notice pd-notice-ok" data-test="payment-mode-status">
                <CircleCheck size={19} />
                <div>
                    <strong>Live mode</strong>
                    <p>Stripe is using live keys. Members are charged real money and payments are recorded automatically.</p>
                </div>
            </div>
        );
    }

    if (gateway.is_test_mode) {
        return (
            <div className="pd-notice pd-notice-warn" data-test="payment-mode-status">
                <FlaskConical size={19} />
                <div>
                    <strong>Test mode</strong>
                    <p>{text.detail}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-notice pd-notice-error" data-test="payment-mode-status">
            <CircleAlert size={19} />
            <div>
                <strong>{gateway.mode === 'live' ? 'Live mode, but not fully set up' : 'Payments are not set up'}</strong>
                <p>{gateway.mode === 'live' ? 'Add the webhook signing secret so payments can be confirmed.' : text.detail}</p>
            </div>
        </div>
    );
}

function DetectedMode({ value }: { value: string }) {
    const mode = modeOfKey(value);

    if (!value || !mode) {
        return null;
    }

    return <span className={`pond-mode-chip pond-mode-chip-${mode}`}>{mode === 'test' ? 'Test mode key' : 'Live mode key'}</span>;
}

export default function PaymentSettings({ stripe, gateway, webhook, canEdit }: Props) {
    const [isRemoving, setIsRemoving] = useState(false);
    const form = useForm({
        stripe_enabled: stripe.enabled,
        stripe_publishable_key: stripe.publishable_key ?? '',
        stripe_secret_key: '',
        stripe_webhook_secret: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(adminStripe.update(), {
            preserveScroll: true,
            onSuccess: () => form.reset('stripe_secret_key', 'stripe_webhook_secret'),
        });
    };

    const copyWebhookUrl = () => {
        navigator.clipboard
            ?.writeText(webhook.url)
            .then(() => toast.success('Webhook URL copied'))
            .catch(() => toast.info(webhook.url));
    };

    const checkConnection = () => router.post(adminStripe.test.url(), {}, { preserveScroll: true });

    const removeKeys = () => {
        router.delete(adminStripe.destroy.url(), { preserveScroll: true, onFinish: () => setIsRemoving(false) });
    };

    return (
        <>
            <Head title="Payment settings" />
            <PondShell page="Payment settings" subheading="Connect Stripe to take payments. Keys are stored encrypted and never shown again." demo={false}>
                <ModeStatus gateway={gateway} />

                {stripe.source === 'environment' && (
                    <div className="pd-notice pd-notice-warn">
                        <KeyRound size={19} />
                        <div>
                            <strong>Keys are coming from the server settings</strong>
                            <p>Stripe is currently set up in the server&rsquo;s .env file. Save your keys below to manage them from here instead.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="pd-settings-grid">
                    <section className="pond-panel">
                        <div className="pond-panel-header">
                            <div>
                                <h2>Stripe keys</h2>
                                <p>Find them in the Stripe dashboard under Developers, then API keys. Test and live keys each start differently, and the site works out the mode from the secret key.</p>
                            </div>
                        </div>

                        <label className="pond-toggle-line">
                            <span>Take payments with Stripe</span>
                            <input
                                type="checkbox"
                                checked={form.data.stripe_enabled}
                                disabled={!canEdit}
                                onChange={(event) => form.setData('stripe_enabled', event.target.checked)}
                                data-test="stripe-enabled"
                            />
                            <span className="pond-toggle-ui" />
                        </label>
                        <FieldError message={form.errors.stripe_enabled} />

                        <label className="pond-form-label">
                            Publishable key <span className="pond-optional">(optional)</span>
                            <input
                                className="pond-input"
                                value={form.data.stripe_publishable_key}
                                onChange={(event) => form.setData('stripe_publishable_key', event.target.value)}
                                placeholder="pk_test_… or pk_live_…"
                                autoComplete="off"
                                spellCheck={false}
                                disabled={!canEdit}
                                name="stripe_publishable_key"
                            />
                            <DetectedMode value={form.data.stripe_publishable_key} />
                            <FieldError message={form.errors.stripe_publishable_key} />
                        </label>

                        <label className="pond-form-label">
                            Secret key
                            <input
                                className="pond-input"
                                type="password"
                                value={form.data.stripe_secret_key}
                                onChange={(event) => form.setData('stripe_secret_key', event.target.value)}
                                placeholder={stripe.secret_key_hint ?? 'sk_test_… or sk_live_…'}
                                autoComplete="new-password"
                                spellCheck={false}
                                disabled={!canEdit}
                                name="stripe_secret_key"
                            />
                            {stripe.secret_key_hint && !form.data.stripe_secret_key && (
                                <span className="pond-optional">
                                    Saved: {stripe.secret_key_hint}. Leave blank to keep it.
                                </span>
                            )}
                            <DetectedMode value={form.data.stripe_secret_key || (stripe.mode === 'test' ? 'sk_test_' : stripe.mode === 'live' ? 'sk_live_' : '')} />
                            <FieldError message={form.errors.stripe_secret_key} />
                        </label>

                        <label className="pond-form-label">
                            Webhook signing secret
                            <input
                                className="pond-input"
                                type="password"
                                value={form.data.stripe_webhook_secret}
                                onChange={(event) => form.setData('stripe_webhook_secret', event.target.value)}
                                placeholder={stripe.webhook_secret_hint ?? 'whsec_…'}
                                autoComplete="new-password"
                                spellCheck={false}
                                disabled={!canEdit}
                                name="stripe_webhook_secret"
                            />
                            {stripe.webhook_secret_hint && !form.data.stripe_webhook_secret && (
                                <span className="pond-optional">
                                    Saved: {stripe.webhook_secret_hint}. Leave blank to keep it.
                                </span>
                            )}
                            <FieldError message={form.errors.stripe_webhook_secret} />
                        </label>

                        {canEdit && (
                            <div className="pd-settings-actions">
                                <button type="submit" className="pond-btn pond-btn-primary" disabled={form.processing} data-test="save-stripe-settings">
                                    <Save size={16} /> {form.processing ? 'Checking with Stripe…' : 'Save settings'}
                                </button>
                                <button type="button" className="pond-btn pond-btn-outline-dark" onClick={checkConnection} disabled={form.processing || !stripe.secret_key_hint}>
                                    <PlugZap size={16} /> Test connection
                                </button>
                                {stripe.source === 'dashboard' && (
                                    <button type="button" className="pond-text-btn pd-danger-text" onClick={() => setIsRemoving(true)}>
                                        <Trash2 size={14} /> Remove keys
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="pond-panel">
                        <div className="pond-panel-header">
                            <div>
                                <h2>Webhook</h2>
                                <p>Stripe tells the site when a payment succeeds, even if the member closes their browser first.</p>
                            </div>
                        </div>

                        <ol className="pd-steps">
                            <li>In the Stripe dashboard open Developers, then Webhooks, then Add endpoint.</li>
                            <li>
                                Paste this endpoint URL:
                                <span className="pd-copy-line">
                                    <code>{webhook.url}</code>
                                    <button type="button" className="pond-icon-btn" onClick={copyWebhookUrl} aria-label="Copy webhook URL">
                                        <Copy size={16} />
                                    </button>
                                </span>
                            </li>
                            <li>
                                Select these events:
                                <ul className="pd-event-list">
                                    {webhook.events.map((event) => (
                                        <li key={event}>
                                            <code>{event}</code>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li>Copy the endpoint&rsquo;s signing secret (it starts with whsec_) into the field on the left.</li>
                        </ol>

                        <div className="pond-form-note">
                            <ShieldCheck size={15} /> Secret keys are encrypted before they are saved and are never sent back to your browser.
                        </div>
                    </section>
                </form>

                {isRemoving && (
                    <Modal title="Remove Stripe keys?" subtitle="Members will not be able to pay until Stripe is connected again." onClose={() => setIsRemoving(false)}>
                        <button className="pond-btn pond-btn-primary pond-wide" onClick={removeKeys} data-test="confirm-remove-keys">
                            <Trash2 size={16} /> Remove keys
                        </button>
                    </Modal>
                )}
            </PondShell>
        </>
    );
}
