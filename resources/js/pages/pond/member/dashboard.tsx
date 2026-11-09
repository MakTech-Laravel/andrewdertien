import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, CreditCard, Gem, ReceiptText, Waves } from 'lucide-react';
import { formatMoney, PaymentsTable, StatTile } from '@/components/pond/commerce';
import type { PaymentRow, PondCard } from '@/components/pond/commerce';
import { PondChoiceCard } from '@/components/pond/pond-choice-card';
import { EmptyState, PondShell } from '@/components/pond/ui';
import memberPayments from '@/routes/member/payments';
import memberPonds from '@/routes/member/ponds';

type Props = {
    stats: { owned: number; spent_cents: number; payments: number; available: number };
    currency: string;
    recentPayments: PaymentRow[];
    suggestedPonds: PondCard[];
};

export default function MemberDashboard({ stats, currency, recentPayments, suggestedPonds }: Props) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <>
            <Head title="My dashboard" />
            <PondShell page={`Welcome back, ${firstName}`} subheading="Your ponds and payments, all in one place." demo={false}>
                <div className="pond-dashboard-hero">
                    <div className="pond-dashboard-hero-text">
                        <span className="pond-hero-label">✦ YOUR LITTLE CORNER OF THE UNIVERSE</span>
                        <h2>
                            Big dreams begin
                            <br />
                            with <em>little ripples.</em>
                        </h2>
                        <p>Choose a pond that feels right, and keep the balls rolling.</p>
                        <div>
                            <Link href={memberPonds.index()} className="pond-btn pond-btn-light">
                                Choose a pond <ArrowRight size={16} />
                            </Link>
                            <Link href={memberPonds.owned()} className="pond-btn-ghost-white">
                                My ponds <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    </div>
                    <img className="pond-dashboard-hero-ball hero-ball-main" src="/askupon/balls/golf-blue.png" alt="" />
                    <img className="pond-dashboard-hero-ball hero-ball-secondary" src="/askupon/balls/golf-gold.png" alt="" />
                    <div className="pond-dashboard-circle" />
                </div>

                <div className="pd-stats">
                    <StatTile icon={Gem} label="Ponds owned" value={String(stats.owned)} />
                    <StatTile icon={Waves} label="Ponds to explore" value={String(stats.available)} tone="green" />
                    <StatTile icon={CreditCard} label="Total spent" value={formatMoney(stats.spent_cents, currency)} tone="pink" />
                    <StatTile icon={ReceiptText} label="Payments" value={String(stats.payments)} />
                </div>

                {suggestedPonds.length > 0 && (
                    <section className="pd-section">
                        <div className="pond-panel-header">
                            <h2>Ponds for you</h2>
                            <Link href={memberPonds.index()}>
                                See all <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="pd-pond-grid">
                            {suggestedPonds.map((pond) => (
                                <PondChoiceCard key={pond.id} pond={pond} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="pond-panel pd-section">
                    <div className="pond-panel-header">
                        <h2>Latest payments</h2>
                        <Link href={memberPayments.index()}>
                            Full history <ArrowRight size={16} />
                        </Link>
                    </div>
                    {recentPayments.length ? <PaymentsTable rows={recentPayments} /> : <EmptyState icon={<CreditCard size={25} />} title="No payments yet" body="When you buy a pond, your payment shows up here." />}
                </section>
            </PondShell>
        </>
    );
}
