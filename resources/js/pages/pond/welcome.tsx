import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PondHeroScene } from '@/components/pond/pond-hero-scene';
import { PondOrbitScene } from '@/components/pond/pond-orbit-scene';
import { Brand, PondMark } from '@/components/pond/ui';

const giveWays = [
    {
        title: 'Dreams',
        tone: 'dreams',
        lead: 'Help me make something possible.',
        detail: 'Dreams, goals, and aspirations, whether big or small.',
        ball: '/quantum/images/ball-100.png',
    },
    {
        title: 'Fun',
        tone: 'fun',
        lead: 'Help support me in enjoying an experience.',
        detail: 'Hobbies, interests, activities, and experiences you would love to have.',
        ball: '/quantum/images/ball-10.png',
    },
    {
        title: 'Treats',
        tone: 'treats',
        lead: 'Perhaps a coffee, lunch, or something small.',
        detail: 'Everyday little pleasures, such as coffee, a meal, or a gallon of gas.',
        ball: '/quantum/images/ball-50.png',
    },
    {
        title: 'Boost',
        tone: 'boost',
        lead: 'I get by with a little help from my friends.',
        detail: 'Where a little help would make a difference: groceries, transportation, bills.',
        ball: '/quantum/images/ball-20.png',
    },
    {
        title: 'Support a Creator',
        tone: 'creator',
        lead: 'Show some love to a creator.',
        detail: 'Support a YouTuber, streamer, podcaster, artist, or independent creator you enjoy.',
        ball: '/quantum/images/ball-5.png',
    },
    {
        title: 'Flirt',
        tone: 'flirt',
        lead: 'Give and receive!',
        detail: 'Enable flirtation and find out.',
        ball: '/quantum/images/ball-500.png',
    },
];

const steps = [
    {
        number: '01',
        title: 'Show up as yourself',
        body: 'Create a profile around your Dreams, Fun, and the things that make you, you.',
        ball: '/quantum/images/ball-100.png',
    },
    {
        number: '02',
        title: 'Discover your people',
        body: 'Explore stories, celebrate someone, make connections.',
        ball: '/quantum/images/ball-10.png',
    },
    {
        number: '03',
        title: 'Keep the balls rolling',
        body: 'Give a ball. Get a ball. Pass one along. See what happens.',
        ball: '/quantum/images/ball-20.png',
    },
];

const faqs = [
    { q: 'Is it social media?', a: 'Kind of!' },
    { q: 'Is it crowdfunding?', a: 'You bet!' },
    { q: 'Is it a dating site?', a: 'Enable flirtation and find out!' },
    { q: 'Is it like Venmo or PayPal?', a: 'Yep! Send someone money through the Pond!' },
];

export default function Welcome() {
    return (
        <div className="pond-home askupon-home">
            <Head title="Ask Upon A Pond — Toss a ball in the Pond" />

            <div className="askupon-hero">
                <div className="askupon-hero-sky" aria-hidden="true" />
                <div className="askupon-hero-grain" aria-hidden="true" />

                <nav className="askupon-nav">
                    <Brand dark />
                    <div className="askupon-nav-actions">
                        <Link href="/login" className="askupon-login">
                            Log in
                        </Link>
                        <Link href="/register" className="askupon-btn askupon-btn-pink">
                            Join the Pond <ArrowRight size={16} />
                        </Link>
                    </div>
                </nav>

                <div className="askupon-hero-main">
                    <p className="askupon-script">Balls, Balls, Balls!</p>
                    <h1>
                        <span className="askupon-brush">Toss a ball in the Pond!</span>
                    </h1>
                    <p className="askupon-hero-tag">
                        Give one to a friend, a stranger, or even a flirt!
                    </p>

                    <div className="askupon-pond-stage">
                        <PondHeroScene className="askupon-hero-three" />
                        <div className="askupon-pond-stage-fallback" aria-hidden="true">
                            <div className="askupon-pond-water" />
                            <div className="askupon-pond-sun" />
                            <div className="askupon-pond-trees askupon-pond-trees-left" />
                            <div className="askupon-pond-trees askupon-pond-trees-right" />
                            <img className="askupon-float-ball ball-a" src="/quantum/images/ball-100.png" alt="" />
                            <img className="askupon-float-ball ball-b" src="/quantum/images/ball-10.png" alt="" />
                            <img className="askupon-float-ball ball-c" src="/quantum/images/ball-50.png" alt="" />
                            <img className="askupon-float-ball ball-d" src="/quantum/images/ball-20.png" alt="" />
                            <img className="askupon-float-ball ball-e" src="/quantum/images/ball-5.png" alt="" />
                            <img className="askupon-float-ball ball-f" src="/quantum/images/ball-500.png" alt="" />
                        </div>
                    </div>

                    <p className="askupon-three-hint">
                        <span className="askupon-hint-desktop">Move and click the pond for ripples</span>
                        <span className="askupon-hint-mobile">Tap the pond for ripples</span>
                    </p>

                    <div className="askupon-faq-strip">
                        {faqs.map((item) => (
                            <div key={item.q}>
                                <strong>{item.q}</strong>
                                <em>{item.a}</em>
                            </div>
                        ))}
                    </div>

                    <div className="askupon-hero-ctas">
                        <Link href="/register" className="askupon-btn askupon-btn-pink askupon-btn-lg">
                            Join the Pond <ArrowRight size={18} />
                        </Link>
                        <Link href="/login" className="askupon-btn askupon-btn-ghost askupon-btn-lg">
                            Explore the Balls <ArrowUpRight size={18} />
                        </Link>
                    </div>

                    <p className="askupon-room">
                        <PondMark small /> There&apos;s room for everyone in this Pond.
                    </p>
                </div>
            </div>

            <section className="askupon-imagine">
                <div className="askupon-imagine-copy">
                    <h2>Imagine your asks have already been answered.</h2>
                    <p>And sign up while feeling that feeling.</p>
                    <Link href="/register" className="askupon-come-in">
                        Come on in!
                    </Link>
                </div>
                <div className="askupon-pie-wrap" aria-hidden="true">
                    <div className="askupon-pie">
                        <span className="askupon-pie-crust" />
                        <span className="askupon-pie-lattice" />
                        <span className="askupon-pie-slice" />
                    </div>
                </div>
            </section>

            <section className="askupon-motto" id="how-it-works">
                <h2>
                    <span className="askupon-brush askupon-brush-light">
                        The pond as pie, pie as pond.
                    </span>
                </h2>
                <p>
                    Together, we can expand the pond, the pie, and all have a swim or a
                    slice—however you want to say it!
                </p>
            </section>

            <section className="askupon-steps">
                {steps.map((step) => (
                    <article key={step.number} className="askupon-step">
                        <img src={step.ball} alt="" />
                        <div>
                            <h3>
                                <span>{step.number}</span> {step.title}
                            </h3>
                            <p>{step.body}</p>
                        </div>
                    </article>
                ))}
            </section>

            <section className="askupon-ways" id="explore">
                <div className="askupon-ways-bg" aria-hidden="true">
                    <PondOrbitScene className="askupon-ways-three" />
                </div>
                <div className="askupon-ways-content">
                    <div className="askupon-ways-head">
                        <h2>There&apos;s more than one way to make someone&apos;s day.</h2>
                        <p>Six simple ways to give a little support, fun, or love.</p>
                    </div>
                    <div className="askupon-ways-grid">
                        {giveWays.map((way) => (
                            <article key={way.title} className={`askupon-way way-${way.tone}`}>
                                <img src={way.ball} alt="" />
                                <div>
                                    <h3>{way.title}</h3>
                                    <strong>{way.lead}</strong>
                                    <p>{way.detail}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="askupon-ways-ctas">
                        <Link href="/register" className="askupon-btn askupon-btn-pink askupon-btn-lg">
                            Join the Pond <ArrowRight size={18} />
                        </Link>
                        <Link href="/login" className="askupon-btn askupon-btn-navy askupon-btn-lg">
                            Explore the Balls <ArrowUpRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="askupon-final">
                <PondMark />
                <h2>Come on in. The Pond&apos;s waiting.</h2>
                <p>Show up as yourself. Toss a ball. Find your people.</p>
                <Link href="/register" className="askupon-btn askupon-btn-pink askupon-btn-lg">
                    Join the Pond <ArrowRight size={18} />
                </Link>
            </section>

            <footer className="askupon-footer">
                <Brand />
                <span>© 2026 Ask Upon A Pond · askuponapond.com</span>
                <div>
                    <Link href="/login">The Pond</Link>
                    <Link href="/login">The Balls</Link>
                    <Link href="/login">Log in</Link>
                    <Link href="/dashboard">Dashboard</Link>
                </div>
            </footer>
        </div>
    );
}
