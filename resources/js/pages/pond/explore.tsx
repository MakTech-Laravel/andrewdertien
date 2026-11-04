import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, Heart, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categories } from '@/components/pond/data';
import type { CategoryKey, MemberProfile } from '@/components/pond/data';
import { Avatar, CategoryPill, EmptyState, hueFor, PondShell, SectionEyebrow } from '@/components/pond/ui';
import { index, show } from '@/routes/members';

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
};

type Props = {
    members: Paginated<MemberProfile>;
    filters: { search: string; category: CategoryKey | '' };
};

/** The first section a member has filled in, used as a teaser on their card. */
function teaser(member: MemberProfile, preferred: CategoryKey | ''): { title: string; text: string } | null {
    const order = preferred ? [preferred, ...categories.map((c) => c.key).filter((k) => k !== preferred)] : categories.map((c) => c.key);

    for (const key of order) {
        const text = member[key];

        if (text) {
            return { title: categories.find((c) => c.key === key)!.title, text };
        }
    }

    return null;
}

export default function Explore({ members, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timer = setTimeout(() => {
            router.get(index.url({ query: { search: search || undefined, category: filters.category || undefined } }), {}, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);

        return () => clearTimeout(timer);
    }, [search, filters.search, filters.category]);

    const chooseCategory = (category: CategoryKey | '') =>
        router.get(index.url({ query: { search: filters.search || undefined, category: category || undefined } }), {}, { preserveState: true, preserveScroll: true });

    return (
        <>
            <Head title="Explore the pond" />
            <PondShell page="Explore the pond" subheading="Find inspiring people, meaningful dreams, and small joys." demo={false}>
                <div className="pond-explore-highlight">
                    <div>
                        <SectionEyebrow>THE BEAUTY OF BELONGING</SectionEyebrow>
                        <h2>
                            There's a whole pond
                            <br />
                            of possibility out there.
                        </h2>
                        <p>Meet the people who make our community feel like home.</p>
                    </div>
                    <div className="pond-explore-orbs">
                        <img src="/quantum/images/ball-1000.png" alt="" />
                        <img src="/quantum/images/ball-10.png" alt="" />
                    </div>
                </div>

                <div className="pond-explore-filters">
                    <div className="pond-inline-search">
                        <Search size={18} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username or city..." aria-label="Search members" />
                    </div>
                    <div className="pond-filter-chips" role="group" aria-label="Filter by profile section">
                        <button className={filters.category === '' ? 'active' : ''} onClick={() => chooseCategory('')}>
                            All
                        </button>
                        {categories.map((c) => (
                            <button key={c.key} className={filters.category === c.key ? 'active' : ''} onClick={() => chooseCategory(c.key)}>
                                {c.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pond-people-grid">
                    {members.data.map((member) => {
                        const highlight = teaser(member, filters.category);

                        return (
                            <Link href={show(member.username!)} className="pond-person-card pond-person-link" key={member.id}>
                                <div className="pond-person-gradient">
                                    <span>{member.open_to_romance ? <Heart size={22} fill="currentColor" aria-label="Open to romantic connections" /> : '✧'}</span>
                                    <Avatar name={member.name} hue={hueFor(member.id)} size="avatar-person" src={member.avatar_url} />
                                </div>
                                <div className="pond-person-body">
                                    <div className="pond-person-name">
                                        <h3>{member.name}</h3>
                                        {highlight && <CategoryPill category={highlight.title} />}
                                    </div>
                                    <p className="pond-person-location">
                                        @{member.username}
                                        {member.location && (
                                            <>
                                                {' · '}
                                                <MapPin size={11} /> {member.location}
                                            </>
                                        )}
                                    </p>
                                    <h4 className="pond-person-teaser">{highlight ? highlight.text : 'Just joined the pond. Say hello!'}</h4>
                                    <span className="pond-btn pond-btn-soft pond-wide">
                                        View profile <ArrowUpRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                    {!members.data.length && <EmptyState icon={<Search />} title="No members found" body="Try a different name, city or section." />}
                </div>

                {members.last_page > 1 && (
                    <nav className="pond-pagination" aria-label="Member pages">
                        {members.prev_page_url ? <Link href={members.prev_page_url} preserveScroll>← Previous</Link> : <span />}
                        <span>
                            Page {members.current_page} of {members.last_page}
                        </span>
                        {members.next_page_url ? <Link href={members.next_page_url} preserveScroll>Next →</Link> : <span />}
                    </nav>
                )}
            </PondShell>
        </>
    );
}
