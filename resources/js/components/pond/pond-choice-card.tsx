import { router } from '@inertiajs/react';
import { ArrowRight, Check, CreditCard, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { formatMoney, PondArt } from '@/components/pond/commerce';
import type { PondCard } from '@/components/pond/commerce';
import { Modal } from '@/components/pond/ui';
import memberCheckout from '@/routes/member/checkout';

/**
 * A pond a member can choose: confirming sends them to the payment page.
 */
export function PondChoiceCard({
    pond,
    isOwned = false,
    isTestMode = false,
}: {
    pond: PondCard;
    isOwned?: boolean;
    isTestMode?: boolean;
}) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const startCheckout = () => {
        setIsRedirecting(true);
        router.post(
            memberCheckout.store.url(pond.slug),
            {},
            { onFinish: () => setIsRedirecting(false) },
        );
    };

    return (
        <>
            <article className="pd-pond-card">
                <PondArt pond={pond} />
                <div className="pd-pond-card-body">
                    <span
                        className={`pd-category pd-category-${pond.category}`}
                    >
                        {pond.category_label}
                    </span>
                    <h3>{pond.name}</h3>
                    {pond.tagline && <p>{pond.tagline}</p>}
                    <div className="pd-pond-card-foot">
                        <strong>
                            {formatMoney(pond.price_cents, pond.currency)}
                        </strong>
                        {isOwned ? (
                            <span className="pd-owned">
                                <Check size={15} /> You own this
                            </span>
                        ) : (
                            <button
                                className="pond-btn pond-btn-primary pd-btn-small"
                                onClick={() => setIsConfirming(true)}
                            >
                                Choose <ArrowRight size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </article>

            {/* Outside the card: its hover transform would otherwise trap the fixed backdrop. */}
            {isConfirming && (
                <Modal
                    title={`Choose ${pond.name}`}
                    subtitle={pond.description ?? pond.tagline ?? undefined}
                    onClose={() => setIsConfirming(false)}
                >
                    <div className="pd-summary">
                        <span>One-time payment</span>
                        <strong>
                            {formatMoney(pond.price_cents, pond.currency)}
                        </strong>
                    </div>
                    {isTestMode && (
                        <div className="pond-form-note pd-test-note">
                            <FlaskConical size={15} /> Test mode: this checkout
                            is simulated and you will not be charged.
                        </div>
                    )}
                    <button
                        className="pond-btn pond-btn-primary pond-wide"
                        onClick={startCheckout}
                        disabled={isRedirecting}
                    >
                        <CreditCard size={17} />{' '}
                        {isRedirecting
                            ? 'Opening secure checkout...'
                            : 'Continue to payment'}
                    </button>
                </Modal>
            )}
        </>
    );
}
