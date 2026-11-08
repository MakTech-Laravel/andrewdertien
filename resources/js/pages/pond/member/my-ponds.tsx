import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, Gem } from 'lucide-react';
import { formatDate, formatMoney, PondArt } from '@/components/pond/commerce';
import type { PaymentRow, PondCard } from '@/components/pond/commerce';
import { EmptyState, PondShell } from '@/components/pond/ui';
import memberPonds from '@/routes/member/ponds';

type Props = {
    purchases: (PaymentRow & { pond: PondCard })[];
};

export default function MyPonds({ purchases }: Props) {
    return (
        <>
            <Head title="My ponds" />
            <PondShell
                page="My ponds"
                subheading="Every pond you have made yours."
                demo={false}
                action={
                    <Link href={memberPonds.index()} className="pond-btn pond-btn-primary">
                        Choose another <ArrowRight size={16} />
                    </Link>
                }
            >
                {purchases.length ? (
                    <div className="pd-pond-grid">
                        {purchases.map((purchase) => (
                            <article className="pd-pond-card" key={purchase.reference}>
                                <PondArt pond={purchase.pond} />
                                <div className="pd-pond-card-body">
                                    <span className={`pd-category pd-category-${purchase.pond.category}`}>{purchase.pond.category_label}</span>
                                    <h3>{purchase.pond_name}</h3>
                                    {purchase.pond.tagline && <p>{purchase.pond.tagline}</p>}
                                    <div className="pd-pond-card-foot">
                                        <small>
                                            Bought {formatDate(purchase.paid_at)} for {formatMoney(purchase.amount_cents, purchase.currency)}
                                        </small>
                                        <span className="pd-owned">
                                            <Check size={15} /> Yours
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="pond-panel">
                        <EmptyState icon={<Gem size={25} />} title="No ponds yet" body="Choose your first pond and it will live here." />
                    </div>
                )}
            </PondShell>
        </>
    );
}
