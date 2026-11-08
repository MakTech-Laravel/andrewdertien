import { Head, router } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { formatMoney, Pagination, paymentStatuses, PaymentsTable } from '@/components/pond/commerce';
import type { PaginatedRows, PaymentRow } from '@/components/pond/commerce';
import { EmptyState, PondShell } from '@/components/pond/ui';
import memberPayments from '@/routes/member/payments';

type Props = {
    payments: PaginatedRows<PaymentRow>;
    totalPaidCents: number;
    currency: string;
    filters: { status: string };
};

export default function MemberPayments({ payments, totalPaidCents, currency, filters }: Props) {
    const chooseStatus = (status: string) =>
        router.get(memberPayments.index.url({ query: { status: status || undefined } }), {}, { preserveState: true, preserveScroll: true });

    return (
        <>
            <Head title="Payment history" />
            <PondShell page="Payment history" subheading={`${formatMoney(totalPaidCents, currency)} paid in total.`} demo={false}>
                <div className="pond-filter-chips pd-chips" role="group" aria-label="Filter by status">
                    <button className={filters.status === '' ? 'active' : ''} onClick={() => chooseStatus('')}>
                        All
                    </button>
                    {paymentStatuses.map((status) => (
                        <button key={status.value} className={filters.status === status.value ? 'active' : ''} onClick={() => chooseStatus(status.value)}>
                            {status.label}
                        </button>
                    ))}
                </div>

                <section className="pond-panel">
                    {payments.data.length ? <PaymentsTable rows={payments.data} /> : <EmptyState icon={<CreditCard size={25} />} title="No payments here" body="Your payments will be listed here." />}
                    <Pagination page={payments} label="Payment pages" />
                </section>
            </PondShell>
        </>
    );
}
