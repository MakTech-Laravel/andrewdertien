import { Head, router } from '@inertiajs/react';
import { Waves } from 'lucide-react';
import type { PondCard } from '@/components/pond/commerce';
import { PondChoiceCard } from '@/components/pond/pond-choice-card';
import { EmptyState, PondShell } from '@/components/pond/ui';
import memberPonds from '@/routes/member/ponds';

type Props = {
    ponds: PondCard[];
    ownedPondIds: number[];
    categories: { value: string; label: string }[];
    filters: { category: string };
    isTestMode: boolean;
};

export default function MemberPonds({ ponds, ownedPondIds, categories, filters, isTestMode }: Props) {
    const chooseCategory = (category: string) =>
        router.get(memberPonds.index.url({ query: { category: category || undefined } }), {}, { preserveState: true, preserveScroll: true });

    return (
        <>
            <Head title="Choose a pond" />
            <PondShell page="Choose a pond" subheading="Six simple ways to give a little support, fun, or love." demo={false}>
                <div className="pond-filter-chips pd-chips" role="group" aria-label="Filter by category">
                    <button className={filters.category === '' ? 'active' : ''} onClick={() => chooseCategory('')}>
                        All
                    </button>
                    {categories.map((category) => (
                        <button key={category.value} className={filters.category === category.value ? 'active' : ''} onClick={() => chooseCategory(category.value)}>
                            {category.label}
                        </button>
                    ))}
                </div>

                {ponds.length ? (
                    <div className="pd-pond-grid">
                        {ponds.map((pond) => (
                            <PondChoiceCard key={pond.id} pond={pond} isOwned={ownedPondIds.includes(pond.id)} isTestMode={isTestMode} />
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<Waves size={25} />} title="No ponds here yet" body="Try another category, or check back soon." />
                )}
            </PondShell>
        </>
    );
}
