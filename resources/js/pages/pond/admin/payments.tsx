import { Head, router } from '@inertiajs/react';
import { Clock3, CreditCard, RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatMoney, Pagination, paymentStatuses, PaymentsTable, StatTile } from '@/components/pond/commerce';
import type { PaginatedRows, PaymentRow } from '@/components/pond/commerce';
import { EmptyState, Modal, PondShell } from '@/components/pond/ui';
import adminPayments from '@/routes/admin/payments';
import adminUsers from '@/routes/admin/users';

type Props = {
    payments: PaginatedRows<PaymentRow>;
    totals: { paid_cents: number; refunded_cents: number; pending: number };
    currency: string;
    ponds: { id: number; name: string }[];
    filters: { search: string; status: string; pond: number | null };
};

export default function AdminPayments({ payments, totals, currency, ponds, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [refunding, setRefunding] = useState<PaymentRow | null>(null);

    const applyFilters = (change: Partial<Props['filters']>) => {
        const next = { ...filters, search, ...change };

        router.get(
            adminPayments.index.url({ query: { search: next.search || undefined, status: next.status || undefined, pond: next.pond || undefined } }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = setTimeout(() => applyFilters({ search }), 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    return (
        <>
            <Head title="Purchases & payments" />
            <PondShell page="Purchases & payments" subheading="Who bought which pond, and every payment behind it." demo={false}>
                <div className="pd-stats pd-stats-3">
                    <StatTile icon={CreditCard} label="Collected" value={formatMoney(totals.paid_cents, currency)} tone="green" />
                    <StatTile icon={RotateCcw} label="Refunded" value={formatMoney(totals.refunded_cents, currency)} tone="pink" />
                    <StatTile icon={Clock3} label="Awaiting payment" value={String(totals.pending)} />
                </div>

                <div className="pd-toolbar">
                    <div className="pond-inline-search">
                        <Search size={18} />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member, pond or reference..." aria-label="Search payments" />
                    </div>
                    <select className="pond-input pd-select" value={filters.status} onChange={(event) => applyFilters({ status: event.target.value })} aria-label="Filter by status">
                        <option value="">All statuses</option>
                        {paymentStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <select className="pond-input pd-select" value={filters.pond ?? ''} onChange={(event) => applyFilters({ pond: Number(event.target.value) || null })} aria-label="Filter by pond">
                        <option value="">All ponds</option>
                        {ponds.map((pond) => (
                            <option key={pond.id} value={pond.id}>
                                {pond.name}
                            </option>
                        ))}
                    </select>
                </div>

                <section className="pond-panel">
                    {payments.data.length ? (
                        <PaymentsTable
                            rows={payments.data}
                            showBuyer
                            buyerHref={(row) => (row.user_id ? adminUsers.show(row.user_id).url : null)}
                            actions={(row) =>
                                row.status === 'paid' ? (
                                    <button className="pond-btn pond-btn-outline-dark pd-btn-small" onClick={() => setRefunding(row)}>
                                        <RotateCcw size={14} /> Refund
                                    </button>
                                ) : null
                            }
                        />
                    ) : (
                        <EmptyState icon={<CreditCard size={25} />} title="No payments found" body="Try a different search or filter." />
                    )}
                    <Pagination page={payments} label="Payment pages" />
                </section>

                {refunding && (
                    <Modal
                        title={`Refund ${formatMoney(refunding.amount_cents, refunding.currency)}?`}
                        subtitle={`${refunding.buyer_name} gets the full amount back and stops owning ${refunding.pond_name}. This cannot be undone.`}
                        onClose={() => setRefunding(null)}
                    >
                        <div className="pd-modal-actions">
                            <button className="pond-btn pond-btn-outline-dark" onClick={() => setRefunding(null)}>
                                Keep payment
                            </button>
                            <button
                                className="pond-btn pd-btn-danger"
                                onClick={() => {
                                    router.post(adminPayments.refund.url(refunding.reference), {}, { preserveScroll: true });
                                    setRefunding(null);
                                }}
                            >
                                <RotateCcw size={16} /> Refund payment
                            </button>
                        </div>
                    </Modal>
                )}
            </PondShell>
        </>
    );
}
