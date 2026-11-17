import { usePage } from '@inertiajs/react';
import { FlaskConical } from 'lucide-react';

/** What kind of payments the site is taking right now. */
export type PaymentMode = 'sandbox' | 'test' | 'live' | 'unconfigured' | 'unavailable';

export const paymentModeText: Record<PaymentMode, { label: string; detail: string }> = {
    sandbox: { label: 'Test mode', detail: 'Checkouts are simulated on this site. No money moves.' },
    test: { label: 'Test mode', detail: 'Stripe is using test keys. Only test cards work and no real money moves.' },
    live: { label: 'Live mode', detail: 'Stripe is using live keys. Real cards are charged.' },
    unconfigured: { label: 'Not set up', detail: 'Stripe is switched on but its keys are missing or not recognised.' },
    unavailable: { label: 'Unavailable', detail: 'No payment provider is available right now.' },
};

/** The site-wide payment mode that the server shares with every signed-in page. */
export function usePaymentMode(): { mode: PaymentMode; isTestMode: boolean } | null {
    const { payments } = usePage().props as { payments?: { mode: PaymentMode; is_test_mode: boolean } | null };

    return payments ? { mode: payments.mode, isTestMode: payments.is_test_mode } : null;
}

/**
 * A small "Test mode" pill that shows whenever payments are fake, so nobody
 * mistakes a test checkout for real money. It renders nothing in live mode.
 */
export function PaymentModeBadge() {
    const payments = usePaymentMode();

    if (!payments?.isTestMode) {
        return null;
    }

    return (
        <span className="pond-mode-badge" role="status" title={paymentModeText[payments.mode].detail} data-test="payment-mode-badge">
            <FlaskConical size={13} aria-hidden="true" />
            <span className="pond-mode-long">Test mode</span>
            <span className="pond-mode-short">Test</span>
        </span>
    );
}
