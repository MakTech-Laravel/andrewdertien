import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CircleAlert, CircleCheck, CreditCard, FlaskConical, Plus, ShoppingBag, Users, Waves } from 'lucide-react';
import { formatMoney, PaymentsTable, PondArt, StatTile } from '@/components/pond/commerce';
import type { PaymentRow } from '@/components/pond/commerce';
import { EmptyState, PondShell } from '@/components/pond/ui';
import adminPayments from '@/routes/admin/payments';
import adminPonds from '@/routes/admin/ponds';
import adminUsers from '@/routes/admin/users';

type Props = {
    stats: { revenue_cents: number; revenue_30d_cents: number; purchases: number; members: number; buyers: number; ponds: number; ponds_on_frontend: number };
    currency: string;
    revenueByMonth: { month: string; revenue_cents: number }[];
    recentPayments: PaymentRow[];
    topPonds: { id: number; name: string; image_url: string; sales: number; revenue_cents: number }[];
    gateway: { driver: string; is_test_mode: boolean; is_ready: boolean };
};

function RevenueChart({ months, currency }: { months: Props['revenueByMonth']; currency: string }) {
    const highest = Math.max(...months.map((month) => month.revenue_cents), 1);

    return (
        <div className="pd-bars" role="img" aria-label={`Revenue by month: ${months.map((month) => `${month.month} ${formatMoney(month.revenue_cents, currency)}`).join(', ')}`}>
            {months.map((month) => (
                <div className="pd-bar-slot" key={month.month}>
                    <div className="pd-bar-track">
                        <span className="pd-bar-tip">{formatMoney(month.revenue_cents, currency)}</span>
                        <div className="pd-bar" style={{ height: `${Math.max(month.revenue_cents / highest * 100, month.revenue_cents ? 3 : 0)}%` }} />
                    </div>
                    <small>{month.month}</small>
                </div>
            ))}
        </div>
    );
}

function GatewayNotice({ gateway }: { gateway: Props['gateway'] }) {
    if (gateway.is_test_mode) {
        return (
            <div className="pd-notice pd-notice-warn">
                <FlaskConical size={19} />
                <div>
                    <strong>Payments are in test mode</strong>
                    <p>Checkouts are simulated and no money moves. Set PAYMENT_DRIVER=stripe with your Stripe keys to take real payments.</p>
                </div>
            </div>
        );
    }

    if (!gateway.is_ready) {
        return (
            <div className="pd-notice pd-notice-error">
                <CircleAlert size={19} />
                <div>
                    <strong>Stripe is not fully configured</strong>
                    <p>Add STRIPE_SECRET and STRIPE_WEBHOOK_SECRET to your environment before members can pay.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-notice pd-notice-ok">
            <CircleCheck size={19} />
            <div>
                <strong>Stripe is connected</strong>
                <p>Members pay on Stripe Checkout and payments are recorded automatically.</p>
            </div>
        </div>
    );
}

export default function AdminDashboard({ stats, currency, revenueByMonth, recentPayments, topPonds, gateway }: Props) {
    return (
        <>
            <Head title="Admin overview" />
            <PondShell
                page="Admin overview"
                subheading="Ponds, members and payments at a glance."
                demo={false}
                action={
                    <Link href={adminPonds.create()} className="pond-btn pond-btn-primary">
                        <Plus size={17} /> New pond
                    </Link>
                }
            >
                <GatewayNotice gateway={gateway} />

                <div className="pd-stats">
                    <StatTile icon={CreditCard} label="Total revenue" value={formatMoney(stats.revenue_cents, currency)} hint={`${formatMoney(stats.revenue_30d_cents, currency)} in the last 30 days`} tone="green" />
                    <StatTile icon={ShoppingBag} label="Ponds sold" value={String(stats.purchases)} hint={`${stats.buyers} ${stats.buyers === 1 ? 'buyer' : 'buyers'}`} tone="pink" />
                    <StatTile icon={Users} label="Members" value={String(stats.members)} hint="Registered users" />
                    <StatTile icon={Waves} label="Ponds" value={String(stats.ponds)} hint={`${stats.ponds_on_frontend} on the website`} tone="green" />
                </div>

                <div className="pd-grid-2">
                    <section className="pond-panel">
                        <div className="pond-panel-header">
                            <h2>Revenue, last 6 months</h2>
                        </div>
                        <RevenueChart months={revenueByMonth} currency={currency} />
                    </section>

                    <section className="pond-panel">
                        <div className="pond-panel-header">
                            <h2>Top ponds</h2>
                            <Link href={adminPonds.index()}>
                                Manage <ArrowRight size={16} />
                            </Link>
                        </div>
                        {topPonds.length ? (
                            <ul className="pd-rank">
                                {topPonds.map((pond) => (
                                    <li key={pond.id}>
                                        <PondArt pond={pond} />
                                        <div>
                                            <strong>{pond.name}</strong>
                                            <small>
                                                {pond.sales} {pond.sales === 1 ? 'sale' : 'sales'}
                                            </small>
                                        </div>
                                        <strong>{formatMoney(pond.revenue_cents, currency)}</strong>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState icon={<Waves size={25} />} title="No ponds yet" body="Create your first pond to start selling." />
                        )}
                    </section>
                </div>

                <section className="pond-panel pd-section">
                    <div className="pond-panel-header">
                        <h2>Latest payments</h2>
                        <Link href={adminPayments.index()}>
                            View all <ArrowRight size={16} />
                        </Link>
                    </div>
                    {recentPayments.length ? (
                        <PaymentsTable rows={recentPayments} showBuyer buyerHref={(row) => (row.user_id ? adminUsers.show(row.user_id).url : null)} />
                    ) : (
                        <EmptyState icon={<CreditCard size={25} />} title="No payments yet" body="Payments appear here as soon as members start buying ponds." />
                    )}
                </section>
            </PondShell>
        </>
    );
}
