import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Coffee, Gift, Heart, MapPin, MessageCircle, Mountain, Settings2, ShieldCheck, Smile } from 'lucide-react';
import { useState } from 'react';
import type { MemberProfile } from '@/components/pond/data';
import { InterestIcon, interestTone } from '@/components/pond/interests';
import { Avatar, GiveModal, hueFor, Modal, PondShell } from '@/components/pond/ui';
import { edit } from '@/routes/member-profile';
import { index as explore } from '@/routes/members';

type Props = {
    member: MemberProfile;
    isOwnProfile: boolean;
    canSendSparkBall: boolean;
};

/** Optional extra sections, shown only once a member has filled them in. */
const extraSections = [
    { key: 'fun', title: 'Fun', lead: 'Help support me in enjoying an experience.' },
    { key: 'boost', title: 'Boost', lead: 'I get by with a little help from my friends.' },
    { key: 'about', title: 'A little more about me', lead: '' },
] as const;

export default function Member({ member, isOwnProfile, canSendSparkBall }: Props) {
    const [giving, setGiving] = useState(false);
    const [sparkInfo, setSparkInfo] = useState(false);
    const firstName = member.name.split(' ')[0];
    const possessive = firstName.endsWith('s') ? `${firstName}’` : `${firstName}’s`;
    const emptyNote = isOwnProfile ? 'Nothing here yet. Add something whenever you’re ready.' : `${firstName} hasn’t shared this yet.`;
    const extras = extraSections.filter(({ key }) => member[key]);

    return (
        <>
            <Head title={`${member.name} (@${member.username})`} />
            <PondShell page={member.name} subheading={`Get to know ${firstName}.`} demo={false} hideHeading>
                <div className="pp-page">
                    <div className="pp-hero">
                        <Link href={explore()} className="pp-back">
                            <ArrowLeft size={16} /> Back to the Pond
                        </Link>
                        <h1 className="pp-title">
                            <span>{possessive} Pond Profile</span>
                        </h1>
                    </div>

                    <div className="pp-layout">
                        <aside className="pp-card">
                            <div className="pp-avatar">
                                <Avatar name={member.name} hue={hueFor(member.id)} size="avatar-profile" src={member.avatar_url} />
                                <img className="pp-avatar-ball" src="/askupon/balls/golf-lime.svg" alt="" />
                            </div>
                            <h2>
                                {member.name}{' '}
                                {member.open_to_romance && (
                                    <span className="pond-heart-badge" title="Open to romantic connections" aria-label="Open to romantic connections">
                                        <Heart size={14} fill="currentColor" />
                                    </span>
                                )}
                            </h2>
                            <p className="pp-handle">@{member.username}</p>
                            {member.location && (
                                <p className="pp-location">
                                    <MapPin size={16} /> {member.location}
                                </p>
                            )}
                            <span className="pp-wave" aria-hidden="true" />

                            <h3>{possessive} Interests</h3>
                            {member.interests.length > 0 ? (
                                <ul className="pp-interests">
                                    {member.interests.map((interest) => (
                                        <li key={interest.value} className={`pp-interest pp-interest-${interestTone(interest.value)}`}>
                                            <InterestIcon value={interest.value} size={15} />
                                            {interest.label}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="pp-empty">{emptyNote}</p>
                            )}

                            {isOwnProfile && (
                                <Link href={edit()} className="pond-btn pond-btn-outline-dark pp-edit">
                                    <Settings2 size={16} /> Edit profile
                                </Link>
                            )}
                        </aside>

                        <div className="pp-stories">
                            <section className="pp-story pp-story-dream" aria-labelledby="pp-dream">
                                <Mountain className="pp-story-icon" size={34} aria-hidden="true" />
                                <div>
                                    <h2 id="pp-dream">{possessive} Dream Life</h2>
                                    <p>{member.dreams || emptyNote}</p>
                                </div>
                            </section>

                            <section className="pp-story pp-story-small" aria-labelledby="pp-small">
                                <Coffee className="pp-story-icon" size={34} aria-hidden="true" />
                                <div>
                                    <h2 id="pp-small">A Small Thing That Would Make {isOwnProfile ? 'My' : 'Their'} Day</h2>
                                    <p>{member.treats || emptyNote}</p>
                                </div>
                            </section>

                            {extras.map(({ key, title, lead }) => (
                                <section key={key} className="pp-story pp-story-extra">
                                    <Smile className="pp-story-icon" size={34} aria-hidden="true" />
                                    <div>
                                        <h2>{title}</h2>
                                        {lead && <strong className="pp-lead">{lead}</strong>}
                                        <p>{member[key]}</p>
                                    </div>
                                </section>
                            ))}

                            {!isOwnProfile && (
                                <div className="pp-ctas">
                                    <button type="button" className="pp-cta pp-cta-dream" onClick={() => setGiving(true)}>
                                        <img src="/askupon/balls/golf-white.svg" alt="" />
                                        <span>Buy {possessive} dream life a ball</span>
                                        <ArrowRight size={18} />
                                    </button>
                                    <button type="button" className="pp-cta pp-cta-small" onClick={() => setGiving(true)}>
                                        <img src="/askupon/balls/golf-gold.svg" alt="" />
                                        <span>Randomly buy {firstName} one of the small things.</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="pp-how">
                        <img src="/askupon/balls/golf-white.svg" alt="" />
                        <div>
                            <h2>How It Works</h2>
                            <strong>A ball is a simple, fun way to give support.</strong>
                            <p>
                                You can send a ball to help {possessive} big dream (such as land, a project, or a goal) or randomly gift one of the small things that would make{' '}
                                {isOwnProfile ? 'your' : 'their'} day.
                            </p>
                        </div>
                    </section>

                    {!isOwnProfile && (
                        <div className="pp-actions">
                            <button type="button" className="pp-action pp-action-give" onClick={() => setGiving(true)}>
                                <Gift size={18} /> Give a ball
                            </button>
                            {canSendSparkBall && (
                                <button type="button" className="pp-action" onClick={() => setSparkInfo(true)}>
                                    <Heart size={18} /> Send a Spark Ball
                                </button>
                            )}
                            <Link href="/preview/messages" className="pp-action">
                                <MessageCircle size={18} /> Send a message
                            </Link>
                            <Link href={explore()} className="pp-action">
                                <ArrowLeft size={18} /> Back to the Pond
                            </Link>
                        </div>
                    )}
                </div>

                {giving && <GiveModal onClose={() => setGiving(false)} member={member.name} />}
                {sparkInfo && (
                    <Modal title="Spark Balls are coming soon ✨" subtitle={`${firstName} is open to romantic connections.`} onClose={() => setSparkInfo(false)}>
                        <div className="pond-safety-illustration">
                            <ShieldCheck size={30} />
                            <p>Buying and sending Spark Balls ($33 First Spark, $77 Chemistry, $108 Cosmic Connection) arrives with the giving system. Nothing has been charged.</p>
                        </div>
                        <button className="pond-btn pond-btn-primary pond-wide" onClick={() => setSparkInfo(false)}>
                            Got it
                        </button>
                    </Modal>
                )}
            </PondShell>
        </>
    );
}
