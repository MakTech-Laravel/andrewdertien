import { Link } from '@inertiajs/react';
import { CheckCircle2, CircleAlert, CircleSlash, Clock3, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type PondCard = {
    id: number;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    category: string;
    category_label: string;
    price_cents: number;
    currency: string;
    image_url: string;
};

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export type PaymentRow = {
    reference: string;
    user_id: number | null;
    buyer_name: string;
    buyer_email: string;
    pond_name: string;
    pond_slug: string | null;
    amount_cents: number;
    currency: string;
    status: PaymentStatus;
    gateway: string;
    failure_message: string | null;
    created_at: string | null;
    paid_at: string | null;
    refunded_at: string | null;
};

export type PaginatedRows<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export const paymentStatuses: { value: PaymentStatus; label: string }[] = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
];

const statusIcons: Record<PaymentStatus, LucideIcon> = {
    paid: CheckCircle2,
    pending: Clock3,
    failed: CircleAlert,
    cancelled: CircleSlash,
    refunded: RotateCcw,
};

export function formatMoney(cents: number, currency: string): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase(), currencyDisplay: 'narrowSymbol' }).format(cents / 100);
}

export function formatDate(iso: string | null): string {
    return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
    const Icon = statusIcons[status];

    return (
        <span className={`pd-status pd-status-${status}`}>
            <Icon size={13} aria-hidden="true" />
            {paymentStatuses.find((option) => option.value === status)?.label}
        </span>
    );
}

export function StatTile({ icon: Icon, label, value, hint, tone = 'purple' }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: 'purple' | 'pink' | 'green' }) {
    return (
        <div className="pond-mini-stat pd-stat">
            <div className={`pond-mini-stat-icon stat-${tone}`}>
                <Icon size={21} />
            </div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                {hint && <small>{hint}</small>}
            </div>
        </div>
    );
}

export function PondArt({ pond }: { pond: Pick<PondCard, 'image_url' | 'name'> }) {
    const isBall = pond.image_url.startsWith('/quantum/images/');

    return (
        <div className={`pd-pond-art ${isBall ? 'is-ball' : 'is-photo'}`}>
            <img src={pond.image_url} alt={isBall ? '' : pond.name} />
        </div>
    );
}

export function Pagination({ page, label }: { page: Pick<PaginatedRows<unknown>, 'current_page' | 'last_page' | 'prev_page_url' | 'next_page_url'>; label: string }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav className="pond-pagination" aria-label={label}>
            {page.prev_page_url ? <Link href={page.prev_page_url} preserveScroll>← Previous</Link> : <span />}
            <span>
                Page {page.current_page} of {page.last_page}
            </span>
            {page.next_page_url ? <Link href={page.next_page_url} preserveScroll>Next →</Link> : <span />}
        </nav>
    );
}

/**
 * Payment history as a table. `showBuyer` adds who paid, for the admin's views;
 * `actions` adds a trailing cell per row.
 */
export function PaymentsTable({ rows, showBuyer = false, buyerHref, actions }: { rows: PaymentRow[]; showBuyer?: boolean; buyerHref?: (row: PaymentRow) => string | null; actions?: (row: PaymentRow) => ReactNode }) {
    return (
        <div className="pd-table-wrap">
            <table className="pd-table">
                <thead>
                    <tr>
                        <th scope="col">Pond</th>
                        {showBuyer && <th scope="col">Member</th>}
                        <th scope="col" className="pd-hide-mobile">
                            Date
                        </th>
                        <th scope="col" className="pd-hide-mobile">
                            Reference
                        </th>
                        <th scope="col">Status</th>
                        <th scope="col" className="pd-num">
                            Amount
                        </th>
                        {actions && (
                            <th scope="col">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const href = buyerHref?.(row);

                        return (
                            <tr key={row.reference}>
                                <td>
                                    <strong>{row.pond_name}</strong>
                                    <small className="pd-show-mobile">{formatDate(row.paid_at ?? row.created_at)}</small>
                                    {row.failure_message && <small>{row.failure_message}</small>}
                                </td>
                                {showBuyer && (
                                    <td>
                                        {href ? <Link href={href} className="pd-link"><strong>{row.buyer_name}</strong></Link> : <strong>{row.buyer_name}</strong>}
                                        <small>{row.buyer_email}</small>
                                    </td>
                                )}
                                <td className="pd-nowrap pd-hide-mobile">{formatDate(row.paid_at ?? row.created_at)}</td>
                                <td className="pd-mono pd-hide-mobile">{row.reference}</td>
                                <td>
                                    <StatusBadge status={row.status} />
                                </td>
                                <td className="pd-num">
                                    <strong>{formatMoney(row.amount_cents, row.currency)}</strong>
                                </td>
                                {actions && <td className="pd-actions">{actions(row)}</td>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
