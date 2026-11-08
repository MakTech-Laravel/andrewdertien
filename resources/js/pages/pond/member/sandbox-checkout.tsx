import { Head, router } from '@inertiajs/react';
import { CreditCard, FlaskConical, X } from 'lucide-react';
import { formatMoney } from '@/components/pond/commerce';
import type { PaymentRow } from '@/components/pond/commerce';
import { PondShell } from '@/components/pond/ui';
import sandbox from '@/routes/payments/sandbox';

export default function SandboxCheckout({ purchase }: { purchase: PaymentRow }) {
    const finish = (outcome: 'pay' | 'decline') => router.post(sandbox.complete.url(purchase.reference), { outcome });

    return (
        <>
            <Head title="Test checkout" />
            <PondShell page="Test checkout" subheading="This page stands in for the payment provider." demo={false}>
                <section className="pond-panel pd-checkout">
                    <div className="pd-notice pd-notice-warn">
                        <FlaskConical size={19} />
                        <div>
                            <strong>Test mode</strong>
                            <p>No card is needed and no money moves.</p>
                        </div>
                    </div>
                    <div className="pd-summary">
                        <span>{purchase.pond_name}</span>
                        <strong>{formatMoney(purchase.amount_cents, purchase.currency)}</strong>
                    </div>
                    <button className="pond-btn pond-btn-primary pond-wide" onClick={() => finish('pay')}>
                        <CreditCard size={17} /> Simulate successful payment
                    </button>
                    <button className="pond-btn pond-btn-outline-dark pond-wide" onClick={() => finish('decline')}>
                        <X size={17} /> Simulate declined payment
                    </button>
                </section>
            </PondShell>
        </>
    );
}
