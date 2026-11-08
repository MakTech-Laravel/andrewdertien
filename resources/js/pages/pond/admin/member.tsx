import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Gem, Pencil, ReceiptText, Waves } from 'lucide-react';
import { formatDate, formatMoney, PaymentsTable, PondArt, StatTile } from '@/components/pond/commerce';
import type { PaymentRow, PondCard } from '@/components/pond/commerce';
import { Avatar, EmptyState, hueFor, PondShell } from '@/components/pond/ui';
import adminUsers from '@/routes/admin/users';

type Props = {
    member: { id: number; name: string; email: string; username: string | null; location: string | null; email_verified_at: string | null; avatar_url: string | null; roles: string[]; joined_at: string | null };
    stats: { owned: number; spent_cents: number; payments: number };
    ownedPonds: (PaymentRow & { pond: PondCard })[];
    payments: PaymentRow[];
    currency: string;
};

export default function AdminMember({ member, stats, ownedPonds, payments, currency }: Props) {
    return (
        <>
            <Head title={member.name} />
            <PondShell
                page={member.name}
                subheading={member.email}
                demo={false}
                action={
                    <div className="pd-heading-actions">
                        <Link href={adminUsers.index()} className="pond-btn pond-btn-outline-dark">
                            <ArrowLeft size={16} /> Members
                        </Link>
                        <Link href={adminUsers.edit(member.id)} className="pond-btn pond-btn-primary">
                            <Pencil size={16} /> Edit
                        </Link>
                    </div>
                }
            >
                <section className="pond-panel pd-member-card">
                    <Avatar name={member.name} hue={hueFor(member.id)} size="avatar-large" src={member.avatar_url} />
                    <dl>
                        <div>
                            <dt>Role</dt>
                            <dd className="pd-capitalize">{member.roles.join(', ') || 'None'}</dd>
                        </div>
                        <div>
                            <dt>Username</dt>
                            <dd>{member.username ? `@${member.username}` : '—'}</dd>
                        </div>
                        <div>
                            <dt>Location</dt>
                            <dd>{member.location ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Email verified</dt>
                            <dd>{member.email_verified_at ? 'Yes' : 'Not yet'}</dd>
                        </div>
                        <div>
                            <dt>Joined</dt>
                            <dd>{formatDate(member.joined_at)}</dd>
                        </div>
                    </dl>
                </section>

                <div className="pd-stats pd-stats-3">
                    <StatTile icon={Gem} label="Ponds owned" value={String(stats.owned)} />
                    <StatTile icon={CreditCard} label="Total spent" value={formatMoney(stats.spent_cents, currency)} tone="green" />
                    <StatTile icon={ReceiptText} label="Payment attempts" value={String(stats.payments)} tone="pink" />
                </div>

                <section className="pond-panel pd-section">
                    <div className="pond-panel-header">
                        <h2>Ponds owned</h2>
                    </div>
                    {ownedPonds.length ? (
                        <ul className="pd-rank">
                            {ownedPonds.map((purchase) => (
                                <li key={purchase.reference}>
                                    <PondArt pond={purchase.pond} />
                                    <div>
                                        <strong>{purchase.pond_name}</strong>
                                        <small>Bought {formatDate(purchase.paid_at)}</small>
                                    </div>
                                    <strong>{formatMoney(purchase.amount_cents, purchase.currency)}</strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState icon={<Waves size={25} />} title="No ponds yet" body="This member has not bought a pond." />
                    )}
                </section>

                <section className="pond-panel pd-section">
                    <div className="pond-panel-header">
                        <h2>Payment history</h2>
                    </div>
                    {payments.length ? <PaymentsTable rows={payments} /> : <EmptyState icon={<CreditCard size={25} />} title="No payments yet" body="Nothing has been charged to this member." />}
                </section>
            </PondShell>
        </>
    );
}
