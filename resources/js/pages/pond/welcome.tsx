import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Gift, HandHeart, Play, UsersRound } from 'lucide-react';
import type { PondCard } from '@/components/pond/commerce';
import { DuskPondScene, FriendswoodSign } from '@/components/pond/dusk-scene';
import { useScrollReveal } from '@/components/pond/pond-motion';
import { PublicPondGrid } from '@/components/pond/public-pond-grid';
import { PublicNavActions } from '@/components/pond/public-shell';
import { Brand, PondMark } from '@/components/pond/ui';
import { dashboard, register } from '@/routes';
import { index as pondsIndex } from '@/routes/ponds';

const ballTiles = [
    { title: 'Dreams', tone: 'dreams', ball: 'blue' },
    { title: 'Fun', tone: 'fun', ball: 'purple' },
    { title: 'Treats', tone: 'treats', ball: 'orange' },
    { title: 'Boost', tone: 'boost', ball: 'white' },
    { title: 'Support a Creator', tone: 'creator', ball: 'red' },
    { title: 'Flirt', tone: 'flirt', ball: 'green' },
];

const stories = [
    {
        title: 'The Boy and the Pond',
        image: '/askupon/story/boy.jpg',
        alt: 'Andrew as a small boy in a striped shirt',
        position: '50% 35%',
        paragraphs: [
            'At 10, I snuck out at night, met my friends, collected golf balls from a pond, and sold them back to golfers.',
            'Making money was fun. It was an adventure!',
            'Then came adulthood. And getting a real job.',
        ],
    },
    {
        title: 'The Hard Road',
        image: '/askupon/story/book-cover.jpg',
        alt: 'Cover of Andrew Dertien’s book Uber Dick: Down and Out in San Francisco',
        position: '50% 8%',
        paragraphs: ['Years later came loss, struggle, and rebuilding while supporting my kids.'],
    },
    {
        title: 'My Son’s Vision',
        image: '/askupon/story/james.jpg',
        alt: 'James, Andrew’s son',
        position: '45% 30%',
        paragraphs: [
            'My son James has a dream. He wants to spend his last year of high school outside the city, on a piece of land where he can raise dogs, grow food, and learn to live off the land.',
            'That curriculum sure does beat SF public schools.',
            'And that’s my dream too! I’ve wanted to leave San Francisco for years.',
        ],
    },
    {
        title: 'Ask Upon a Pond',
        image: null,
        alt: '',
        position: '',
        paragraphs: [
            'So how are we going to make it happen?',
            'Start a GoFundMe? Eh. Why not create our own thing?',
            'A place where people can connect, share their worlds, give, receive, and help each other make things happen.',
        ],
    },
];

const actions = [
    { title: 'Collect', ball: 'blue', body: 'Buy a few, build your collection, and keep them for whenever you feel like making a splash.' },
    { title: 'Give', ball: 'purple', body: 'See someone you like? Love their story? Want to brighten their day? Toss them a ball or two.' },
    { title: 'Receive', ball: 'gold', body: 'Share your world. Your dreams, your adventures, or just what you’re up to. You never know who might toss something your way.' },
    { title: 'Play', ball: 'green', body: 'Hold onto your balls, send them to someone, or save them for something special. It’s your Pond.' },
];

const actionIcons = { Collect: UsersRound, Give: Gift, Receive: HandHeart, Play: Play };

function golfBall(color: string): string {
    return `/askupon/balls/golf-${color}.svg`;
}

export default function Welcome({ ponds = [] }: { ponds?: PondCard[] }) {
    const { auth } = usePage().props;
    const joinHref = auth?.user ? dashboard() : register();

    useScrollReveal('.hm-tile, .hm-story-card, .hm-muddy-copy, .hm-action, .pd-home-ponds .pd-pond-card, .hm-final h2');

    return (
        <div className="pond-home askupon-home hm-page">
            <Head title="Ask Upon A Pond — Connect. Share your world. Give and receive." />

            <section className="hm-hero">
                <DuskPondScene />
                <header className="hm-nav">
                    <nav className="askupon-nav">
                        <Brand dark />
                        <div className="hm-nav-links">
                            <a href="#explore">Explore the Pond</a>
                            <a href="#muddy-bottoms">How It Works</a>
                            <a href="#once-upon-a-pond">Our Story</a>
                            <Link href={pondsIndex()}>Community</Link>
                        </div>
                        <div className="askupon-nav-actions">
                            <PublicNavActions />
                        </div>
                    </nav>
                </header>

                <div className="hm-hero-copy">
                    <h1>
                        Connect. Share your world. <span>Give and receive.</span>
                    </h1>
                    <p>
                        A little Insta. A little Cash App. A little GoFundMe. Even a little Tinder (if you check that box). A whole lot of experimentation.{' '}
                        <em>All in one Pond.</em>
                    </p>
                    <div className="hm-hero-buttons">
                        <Link href={pondsIndex()} className="hm-btn hm-btn-explore">
                            Explore the Pond <ArrowRight size={18} />
                        </Link>
                        <Link href={joinHref} className="hm-btn hm-btn-join">
                            Join the Pond <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="hm-tiles-wrap" id="explore" aria-label="Ways to use the Pond">
                <div className="hm-tiles">
                    {ballTiles.map((tile) => (
                        <div key={tile.title} className={`hm-tile hm-tile-${tile.tone}`}>
                            <img src={golfBall(tile.ball)} alt="" />
                            <strong>{tile.title}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <section className="hm-once" id="once-upon-a-pond">
                <h2 className="hm-heading">
                    <span>Once Upon a Pond</span>
                </h2>
                <p className="hm-subheading">The story behind the Pond.</p>
                <div className="hm-stories">
                    {stories.map((story, index) => (
                        <article key={story.title} className="hm-story-card">
                            <div className={`hm-story-media ${story.image ? '' : 'hm-story-media-pond'}`}>
                                {story.image ? <img src={story.image} alt={story.alt} style={{ objectPosition: story.position }} loading="lazy" /> : <PondMark />}
                            </div>
                            <div className="hm-story-body">
                                <h3>
                                    <span>{index + 1}.</span> {story.title}
                                </h3>
                                {story.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="hm-muddy" id="muddy-bottoms">
                <div className="hm-muddy-card">
                    <FriendswoodSign />
                    <div className="hm-muddy-copy">
                        <h2 className="hm-heading hm-heading-left">
                            <span>Let&rsquo;s Talk Muddy Bottoms</span>
                        </h2>
                        <p>Back in Friendswood, Texas, we&rsquo;d wade barefoot into those muddy ponds in the humid summer heat, feeling around with our feet.</p>
                        <p>And then we&rsquo;d feel it. Something round. Something solid.</p>
                        <p className="hm-chaching">CHA-CHING!</p>
                        <p>That&rsquo;s the feeling we want to bring to the Pond.</p>
                        <p>Every time you buy a ball. Every time you give a ball. Every time you receive a ball.</p>
                        <p className="hm-quantum">Maybe they&rsquo;re quantum balls. Part money. Part hope. Who knows how far one might go?</p>
                    </div>
                </div>

                <div className="hm-actions">
                    {actions.map((action) => {
                        const Icon = actionIcons[action.title as keyof typeof actionIcons];

                        return (
                            <article key={action.title} className={`hm-action hm-action-${action.title.toLowerCase()}`}>
                                <span className="hm-action-icon">
                                    <img src={golfBall(action.ball)} alt="" />
                                    <Icon size={18} aria-hidden="true" />
                                </span>
                                <h3>{action.title}</h3>
                                <p>{action.body}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            {ponds.length > 0 && (
                <section className="pd-home-ponds" id="ponds">
                    <div className="askupon-ways-head">
                        <h2>Find your pond.</h2>
                        <p>Pick the one that feels like yours.</p>
                    </div>
                    <PublicPondGrid ponds={ponds} />
                    <div className="askupon-ways-ctas">
                        <Link href={pondsIndex()} className="hm-btn hm-btn-explore hm-btn-dark">
                            See all the ponds <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>
            )}

            <section className="hm-final">
                <h2>Your Pond. Your people. Your adventure.</h2>
                <p>Start collecting. Start connecting. Give. Receive. See where it goes.</p>
                <Link href={joinHref} className="hm-btn hm-btn-join hm-btn-final">
                    Join the Pond <ArrowRight size={18} />
                </Link>
            </section>

            <footer className="hm-footer">
                <Brand dark />
                <span>© 2026 Ask Upon A Pond · askuponapond.com</span>
            </footer>
        </div>
    );
}
