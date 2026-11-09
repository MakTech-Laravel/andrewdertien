import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import type { PondCard } from '@/components/pond/commerce';
import { LawnBalls, PondHeroScene, useScrollReveal } from '@/components/pond/pond-motion';
import { PublicPondGrid } from '@/components/pond/public-pond-grid';
import { PublicNavActions } from '@/components/pond/public-shell';
import { Brand, PondMark } from '@/components/pond/ui';
import { dashboard, register } from '@/routes';
import { index as pondsIndex } from '@/routes/ponds';

const tiles = [
    { title: 'Dreams', tone: 'dreams', ball: 'blue' },
    { title: 'Fun', tone: 'fun', ball: 'purple' },
    { title: 'Treats', tone: 'treats', ball: 'gold' },
    { title: 'Boost', tone: 'boost', ball: 'white' },
    { title: 'Support a Creator', tone: 'creator', ball: 'red' },
    { title: 'Flirt', tone: 'flirt', ball: 'green' },
];

const steps = [
    { number: '01', title: 'Show up as yourself', body: 'Create a profile around your Dreams, Fun, and whatever makes you, you.', ball: 'blue' },
    { number: '02', title: 'Discover your people', body: 'Explore stories, celebrate others, and make connections.', ball: 'purple' },
    { number: '03', title: 'Trust & Flow', body: 'Give. Receive. Pay it forward. See where it goes.', ball: 'gold' },
];

const ways = [
    { title: 'Dreams', tone: 'dreams', ball: 'violet', lead: 'Help me make something possible.', detail: 'Dreams, goals, and aspirations, whether big or small.' },
    { title: 'Fun', tone: 'fun', ball: 'sky', lead: 'Help support me in enjoying an experience.', detail: 'Hobbies, interests, activities, and experiences you would love to have.' },
    { title: 'Treats', tone: 'treats', ball: 'orange', lead: 'Perhaps a coffee, lunch, or something small.', detail: 'Everyday little pleasures, such as coffee, a meal, or a gallon of gas.' },
    { title: 'Boost', tone: 'boost', ball: 'lime', lead: 'I get by with a little help from my friends.', detail: 'Where a little help would make a difference: groceries, transportation, bills.' },
    { title: 'Support a Creator', tone: 'creator', ball: 'pink', lead: 'Show some love to a creator.', detail: 'Support a YouTuber, streamer, podcaster, artist, or independent creator you enjoy.' },
    { title: 'Flirt', tone: 'flirt', ball: 'rainbow', lead: 'Give and receive!', detail: 'Enable flirtation and find out.' },
];

function golfBall(color: string): string {
    return `/askupon/balls/golf-${color}.svg`;
}

export default function Welcome({ ponds = [] }: { ponds?: PondCard[] }) {
    const { auth } = usePage().props;
    const joinHref = auth?.user ? dashboard() : register();

    useScrollReveal('.ln-tile, .ln-story, .ln-imagine h2, .ln-brushed, .ln-strip, .ln-step, .pd-home-ponds .pd-pond-card, .ln-way, .ln-final h2');

    return (
        <div className="pond-home askupon-home ln-page">
            <Head title="Ask Upon A Pond — Toss a ball in the Pond" />

            <header className="ln-nav">
                <nav className="askupon-nav">
                    <Brand dark />
                    <div className="askupon-nav-actions">
                        <PublicNavActions />
                    </div>
                </nav>
            </header>

            <section className="ln-hero">
                <p className="ln-kicker">ASK UPON A POND</p>
                <h1>Balls, Balls, Balls!</h1>
                <p className="ln-marbles">And marvelous marbles, too!</p>
                <PondHeroScene />
                <h2>Collect. Give. Dream.</h2>
                <p className="ln-possibilities">A pond full of possibilities.</p>
                <a href="#how-it-works" className="ln-btn ln-btn-deep ln-btn-wide">
                    <span className="ln-play">
                        <Play size={16} fill="currentColor" />
                    </span>
                    See How It Works
                </a>
            </section>

            <section className="ln-sunset" id="explore">
                <div className="ln-sunset-inner">
                    <div className="ln-wordmark" aria-label="Ask Upon a Pond">
                        <span>
                            Ask Upon a Pond<sup>™</sup>
                        </span>
                        <svg viewBox="0 0 640 86" fill="none" aria-hidden="true">
                            <path d="M0 62C130 22 270 22 366 42c88 18 170 12 250 2-70 22-160 32-250 18C258 46 132 42 0 62Z" fill="#00D8FD" />
                            <ellipse cx="548" cy="68" rx="76" ry="13" stroke="#00D8FD" strokeWidth="5" />
                            <ellipse cx="548" cy="68" rx="36" ry="5" fill="#00D8FD" />
                            <path d="M544 66 566 2" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                            <path d="M566 2l44 15-49 14Z" fill="#FB0343" />
                        </svg>
                    </div>
                    <p className="ln-sunset-tag">A simple way to share dreams, fun, support, and a little help along the way.</p>

                    <div className="ln-tiles">
                        {tiles.map((tile) => (
                            <div key={tile.title} className={`ln-tile ln-tile-${tile.tone}`}>
                                <img src={golfBall(tile.ball)} alt="" />
                                <strong>{tile.title}</strong>
                            </div>
                        ))}
                    </div>

                    <Link href={pondsIndex()} className="ln-btn ln-btn-toss">
                        Toss a Ball in the Pond!
                    </Link>

                    <article className="ln-story">
                        <img src="/askupon/golf-ball-grass.jpg" alt="A white golf ball in the grass beside a pond at sunset" />
                        <div>
                            <h2>It started with three ten-year-olds and a pond.</h2>
                            <p>They&rsquo;d sneak out at night, collect golf balls from the water, and sell them back to golfers.</p>
                            <p>Decades and a few life lessons later, one of those boys had a bigger idea:</p>
                            <p className="ln-story-idea">Let&rsquo;s make giving, receiving, and even money a little more fun.</p>
                            <a href="#how-it-works" className="ln-btn ln-btn-story">
                                Read the Founder&rsquo;s Story <ArrowRight size={18} />
                            </a>
                        </div>
                    </article>
                </div>
            </section>

            <section className="ln-sky">
                <div className="ln-imagine">
                    <h2>Imagine your asks have already been answered.</h2>
                    <p>And sign up while feeling that feeling.</p>
                    <Link href={joinHref} className="ln-btn ln-btn-come">
                        Come on in!
                    </Link>
                    <h3 className="ln-brushed">
                        <span>The pond as pie, pie as pond.</span>
                    </h3>
                </div>

                <img className="ln-strip ln-strip-coins" src="/askupon/coins-on-rocks.jpg" alt="Coins from around the world and two marbles resting on rocks in the water" />

                <div className="ln-grow" id="how-it-works">
                    <p className="ln-grow-copy">Together, we can grow the pond, expand the pie, and make room for everyone to enjoy a swim or a slice&mdash;however you want to dice it!</p>
                    <div className="ln-steps">
                        {steps.map((step) => (
                            <article key={step.number} className="ln-step">
                                <img src={golfBall(step.ball)} alt="" />
                                <div>
                                    <h3>
                                        <span>{step.number}</span> {step.title}
                                    </h3>
                                    <p>{step.body}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <img className="ln-strip ln-strip-shore" src="/askupon/balls-on-shore.jpg" alt="Blue, purple, yellow, white and red golf balls on rocks at the water's edge" />
            </section>

            {ponds.length > 0 && (
                <section className="pd-home-ponds" id="ponds">
                    <div className="askupon-ways-head">
                        <h2>Find your pond.</h2>
                        <p>Pick the one that feels like yours.</p>
                    </div>
                    <PublicPondGrid ponds={ponds} />
                    <div className="askupon-ways-ctas">
                        <Link href={pondsIndex()} className="ln-btn ln-btn-join">
                            See all the ponds <ArrowUpRight size={18} />
                        </Link>
                    </div>
                </section>
            )}

            <div className="ln-course">
                <section className="ln-ways">
                    <div className="ln-ways-card">
                        {ways.map((way) => (
                            <article key={way.title} className="ln-way">
                                <img src={golfBall(way.ball)} alt="" />
                                <div>
                                    <span className={`ln-way-tag ln-way-tag-${way.tone}`}>{way.title}</span>
                                    <strong>{way.lead}</strong>
                                    <p>{way.detail}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ln-cta-panel">
                    <LawnBalls />
                    <div className="ln-cta-actions">
                        <Link href={joinHref} className="ln-btn ln-btn-join">
                            Join the Pond <ArrowRight size={20} />
                        </Link>
                        <Link href={pondsIndex()} className="ln-btn ln-btn-explore">
                            Explore the Pond <ArrowUpRight size={20} />
                        </Link>
                    </div>
                </section>
            </div>

            <section className="ln-final">
                <PondMark />
                <h2>Come on in. The Pond&rsquo;s waiting.</h2>
                <p>Show up as yourself. Toss a ball. Find your people.</p>
                <Link href={joinHref} className="ln-btn ln-btn-join ln-btn-wide">
                    Join the Pond <ArrowRight size={20} />
                </Link>
            </section>

            <footer className="ln-footer">
                <Brand />
                <span>© 2026 Ask Upon A Pond · askuponapond.com</span>
            </footer>
        </div>
    );
}
