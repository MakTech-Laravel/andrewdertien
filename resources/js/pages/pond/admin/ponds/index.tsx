import { Head, Link, router } from '@inertiajs/react';
import { Globe, Pencil, Plus, Search, Trash2, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatMoney, Pagination, PondArt } from '@/components/pond/commerce';
import type { PaginatedRows, PondCard } from '@/components/pond/commerce';
import { EmptyState, Modal, PondShell } from '@/components/pond/ui';
import adminPonds from '@/routes/admin/ponds';
import { show as publicPond } from '@/routes/ponds';

type AdminPond = PondCard & { is_published: boolean; show_on_frontend: boolean; sort_order: number; sales: number };

type Props = {
    ponds: PaginatedRows<AdminPond>;
    filters: { search: string };
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <label className="pd-switch">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
            <span aria-hidden="true" />
        </label>
    );
}

export default function AdminPondsIndex({ ponds, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [deleting, setDeleting] = useState<AdminPond | null>(null);

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = setTimeout(() => {
            router.get(adminPonds.index.url({ query: { search: search || undefined } }), {}, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);

        return () => clearTimeout(timer);
    }, [search, filters.search]);

    const setVisibility = (pond: AdminPond, change: Partial<Pick<AdminPond, 'is_published' | 'show_on_frontend'>>) => {
        router.patch(adminPonds.visibility.url(pond.id), change, { preserveScroll: true, preserveState: true });
    };

    return (
        <>
            <Head title="Ponds" />
            <PondShell
                page="Ponds"
                subheading="Create ponds, and choose what members and the public website can see."
                demo={false}
                action={
                    <Link href={adminPonds.create()} className="pond-btn pond-btn-primary">
                        <Plus size={17} /> New pond
                    </Link>
                }
            >
                <div className="pd-toolbar">
                    <div className="pond-inline-search">
                        <Search size={18} />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ponds..." aria-label="Search ponds" />
                    </div>
                </div>

                <section className="pond-panel">
                    {ponds.data.length ? (
                        <div className="pd-table-wrap">
                            <table className="pd-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Pond</th>
                                        <th scope="col" className="pd-wide-only">
                                            Category
                                        </th>
                                        <th scope="col" className="pd-num">
                                            Price
                                        </th>
                                        <th scope="col" className="pd-num">
                                            Sold
                                        </th>
                                        <th scope="col">For members</th>
                                        <th scope="col">On website</th>
                                        <th scope="col">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ponds.data.map((pond) => (
                                        <tr key={pond.id}>
                                            <td>
                                                <div className="pd-pond-cell">
                                                    <PondArt pond={pond} />
                                                    <div>
                                                        <strong>{pond.name}</strong>
                                                        {pond.tagline && <small>{pond.tagline}</small>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="pd-wide-only">{pond.category_label}</td>
                                            <td className="pd-num">
                                                <strong>{formatMoney(pond.price_cents, pond.currency)}</strong>
                                            </td>
                                            <td className="pd-num">{pond.sales}</td>
                                            <td>
                                                <Toggle label={`Offer ${pond.name} to members`} checked={pond.is_published} onChange={(checked) => setVisibility(pond, { is_published: checked })} />
                                            </td>
                                            <td>
                                                <Toggle label={`Show ${pond.name} on the website`} checked={pond.show_on_frontend} onChange={(checked) => setVisibility(pond, { show_on_frontend: checked })} />
                                            </td>
                                            <td className="pd-actions">
                                                {pond.show_on_frontend && (
                                                    <a href={publicPond.url(pond.slug)} target="_blank" rel="noreferrer" className="pond-icon-btn" aria-label={`View ${pond.name} on the website`}>
                                                        <Globe size={17} />
                                                    </a>
                                                )}
                                                <Link href={adminPonds.edit(pond.id)} className="pond-icon-btn" aria-label={`Edit ${pond.name}`}>
                                                    <Pencil size={17} />
                                                </Link>
                                                <button className="pond-icon-btn pd-danger-icon" onClick={() => setDeleting(pond)} aria-label={`Delete ${pond.name}`}>
                                                    <Trash2 size={17} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState icon={<Waves size={25} />} title="No ponds found" body="Create a pond and it will appear here." />
                    )}
                    <Pagination page={ponds} label="Pond pages" />
                </section>

                {deleting && (
                    <Modal title={`Delete ${deleting.name}?`} subtitle="It disappears from the website and can no longer be bought. Members who already own it, and all payment records, are kept." onClose={() => setDeleting(null)}>
                        <div className="pd-modal-actions">
                            <button className="pond-btn pond-btn-outline-dark" onClick={() => setDeleting(null)}>
                                Keep pond
                            </button>
                            <button
                                className="pond-btn pd-btn-danger"
                                onClick={() => {
                                    router.delete(adminPonds.destroy.url(deleting.id), { preserveScroll: true });
                                    setDeleting(null);
                                }}
                            >
                                <Trash2 size={16} /> Delete pond
                            </button>
                        </div>
                    </Modal>
                )}
            </PondShell>
        </>
    );
}
