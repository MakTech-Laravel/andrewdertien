import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { formatMoney, PondArt } from '@/components/pond/commerce';
import type { PondCard } from '@/components/pond/commerce';
import { show } from '@/routes/ponds';

export function PublicPondGrid({ ponds }: { ponds: PondCard[] }) {
    return (
        <div className="pd-pond-grid">
            {ponds.map((pond) => (
                <Link href={show(pond.slug)} className="pd-pond-card pd-pond-link" key={pond.id}>
                    <PondArt pond={pond} />
                    <div className="pd-pond-card-body">
                        <span className={`pd-category pd-category-${pond.category}`}>{pond.category_label}</span>
                        <h3>{pond.name}</h3>
                        {pond.tagline && <p>{pond.tagline}</p>}
                        <div className="pd-pond-card-foot">
                            <strong>{formatMoney(pond.price_cents, pond.currency)}</strong>
                            <span className="pd-more">
                                View <ArrowUpRight size={15} />
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
