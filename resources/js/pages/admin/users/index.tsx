import { Head, Link, router } from '@inertiajs/react';
import { BadgeCheck, Eye, Gem, Pencil, Plus, Search, Shield, ShoppingBag, Trash2, UserCheck, UserRound, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDate, formatMoney, Pagination, StatTile } from '@/components/pond/commerce';
import { Avatar, EmptyState, hueFor, Modal } from '@/components/pond/ui';
import { usePermission } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import users from '@/routes/admin/users';
import { ADMIN_ROLE, avatarUrl } from '@/types/admin';
import type { AdminUser, Paginated } from '@/types/admin';
import { PERMISSIONS } from '@/types/permissions';

interface UsersIndexProps {
    users: Paginated<AdminUser>;
    roles: string[];
    filters: { search: string; role: string };
    adminCount: number;
    currency: string;
    stats: { total: number; verified: number; buyers: number };
}

function RolePill({ name }: { name: string }) {
    const Icon = name === ADMIN_ROLE ? Shield : UserRound;

    return (
        <span className={`pd-role pd-role-${name}`}>
            <Icon size={13} aria-hidden="true" />
            {name}
        </span>
    );
}

export default function UsersIndex({ users: paginated, roles, filters, adminCount, currency, stats }: UsersIndexProps) {
    const { can } = usePermission();
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? '');
    const [deleting, setDeleting] = useState<AdminUser | null>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            router.get(users.index().url, { search: search || undefined, role: role || undefined }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);

        return () => clearTimeout(timeout);
    }, [search, role]);

    return (
        <>
            <Head title="Members" />

            <div className="pond-page-heading">
                <div>
                    <span className="pond-page-kicker">ASK UPON A POND</span>
                    <h1>Members</h1>
                    <p>Everyone in the Pond, what they own and what they have spent.</p>
                </div>
                {can(PERMISSIONS.USERS.CREATE) && (
                    <Link href={users.create()} className="pond-btn pond-btn-primary">
                        <Plus size={17} /> Add member
                    </Link>
                )}
            </div>

            <div className="pd-stats pd-stats-3">
                <StatTile icon={UsersRound} label="Total accounts" value={String(stats.total)} />
                <StatTile icon={UserCheck} label="Verified" value={String(stats.verified)} tone="green" />
                <StatTile icon={ShoppingBag} label="Own a pond" value={String(stats.buyers)} tone="pink" />
            </div>

            <div className="pd-toolbar">
                <div className="pond-inline-search">
                    <Search size={18} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email..." aria-label="Search members" />
                </div>
                <div className="pond-filter-chips" role="group" aria-label="Filter by role">
                    <button className={role === '' ? 'active' : ''} onClick={() => setRole('')}>
                        All
                    </button>
                    {roles.map((name) => (
                        <button key={name} className={`pd-capitalize ${role === name ? 'active' : ''}`} onClick={() => setRole(name)}>
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            <section className="pond-panel">
                {paginated.data.length ? (
                    <div className="pd-table-wrap">
                        <table className="pd-table">
                            <thead>
                                <tr>
                                    <th scope="col">Member</th>
                                    <th scope="col" className="pd-hide-mobile">
                                        Role
                                    </th>
                                    <th scope="col" className="pd-hide-mobile">
                                        Ponds
                                    </th>
                                    <th scope="col" className="pd-num pd-hide-mobile">
                                        Total spent
                                    </th>
                                    <th scope="col" className="pd-hide-mobile">
                                        Joined
                                    </th>
                                    <th scope="col">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.data.map((user) => {
                                    const isAdmin = user.roles.some((r) => r.name === ADMIN_ROLE);
                                    const pondsOwned = user.ponds_owned ?? 0;

                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="pd-member-cell">
                                                    <Avatar name={user.name} hue={hueFor(user.id)} src={avatarUrl(user.avatar)} />
                                                    <div>
                                                        <Link href={users.show(user.id)} className="pd-member-name">
                                                            {user.name}
                                                            {user.email_verified_at && <BadgeCheck size={15} aria-label="Verified" />}
                                                        </Link>
                                                        <small>{user.email}</small>
                                                        <small className="pd-show-mobile">{formatMoney(Number(user.spent_cents ?? 0), currency)} spent</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="pd-hide-mobile">
                                                {user.roles.map((r) => (
                                                    <RolePill key={r.id} name={r.name} />
                                                ))}
                                            </td>
                                            <td className="pd-hide-mobile">
                                                <span className={`pd-pond-count ${pondsOwned ? 'has-ponds' : ''}`}>
                                                    <Gem size={13} aria-hidden="true" />
                                                    {pondsOwned ? `${pondsOwned} ${pondsOwned === 1 ? 'pond' : 'ponds'}` : 'None yet'}
                                                </span>
                                            </td>
                                            <td className="pd-num pd-hide-mobile">
                                                <strong>{formatMoney(Number(user.spent_cents ?? 0), currency)}</strong>
                                            </td>
                                            <td className="pd-nowrap pd-hide-mobile">{formatDate(user.created_at)}</td>
                                            <td className="pd-actions">
                                                {can(PERMISSIONS.USERS.VIEW) && (
                                                    <Link href={users.show(user.id)} className="pond-icon-btn" aria-label={`View ${user.name}`}>
                                                        <Eye size={17} />
                                                    </Link>
                                                )}
                                                {can(PERMISSIONS.USERS.EDIT) && (
                                                    <Link href={users.edit(user.id)} className="pond-icon-btn" aria-label={`Edit ${user.name}`}>
                                                        <Pencil size={17} />
                                                    </Link>
                                                )}
                                                {can(PERMISSIONS.USERS.DELETE) &&
                                                    (isAdmin && adminCount <= 1 ? (
                                                        <button className="pond-icon-btn" disabled title="The last administrator cannot be deleted." aria-label={`${user.name} cannot be deleted because they are the last administrator`}>
                                                            <Trash2 size={17} />
                                                        </button>
                                                    ) : (
                                                        <button className="pond-icon-btn pd-danger-icon" onClick={() => setDeleting(user)} aria-label={`Delete ${user.name}`}>
                                                            <Trash2 size={17} />
                                                        </button>
                                                    ))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon={<UsersRound size={25} />} title="No members found" body="Try a different name, email or role." />
                )}

                <div className="pd-table-foot">
                    <span>
                        {paginated.total} {paginated.total === 1 ? 'account' : 'accounts'}
                    </span>
                    <Pagination page={paginated} label="Member pages" />
                </div>
            </section>

            {deleting && (
                <Modal title={`Delete ${deleting.name}?`} subtitle="Their account is removed permanently. Their purchase and payment records are kept." onClose={() => setDeleting(null)}>
                    <div className="pd-modal-actions">
                        <button className="pond-btn pond-btn-outline-dark" onClick={() => setDeleting(null)}>
                            Keep member
                        </button>
                        <button
                            className="pond-btn pd-btn-danger"
                            onClick={() => {
                                router.delete(users.destroy(deleting.id).url, { preserveScroll: true });
                                setDeleting(null);
                            }}
                        >
                            <Trash2 size={16} /> Delete member
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Members', href: users.index() },
    ],
};
