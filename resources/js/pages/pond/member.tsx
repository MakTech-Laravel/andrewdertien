import { Head, Link } from '@inertiajs/react';
import { Heart, MapPin, Settings2, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { categories } from '@/components/pond/data';
import type { MemberProfile } from '@/components/pond/data';
import { Avatar, GiveModal, hueFor, Modal, PondShell } from '@/components/pond/ui';
import { edit } from '@/routes/member-profile';

type Props = {
    member: MemberProfile;
    isOwnProfile: boolean;
    canSendSparkBall: boolean;
};

export default function Member({ member, isOwnProfile, canSendSparkBall }: Props) {
    const [giving, setGiving] = useState(false);
    const [sparkInfo, setSparkInfo] = useState(false);
    const firstName = member.name.split(' ')[0];

    return (
        <>
            <Head title={`${member.name} (@${member.username})`} />
            <PondShell page={member.name} subheading={`Get to know ${firstName}.`} demo={false}>
                <div className="pond-profile-grid">
                    <div className="pond-profile-left">
                        <div className="pond-profile-cover">
                            <div className="pond-profile-cover-orb">
                                <img src="/quantum/images/ball-5000.png" alt="" />
                            </div>
                        </div>
                        <div className="pond-profile-card">
                            <div className="pond-profile-identity">
                                <Avatar name={member.name} hue={hueFor(member.id)} size="avatar-profile" src={member.avatar_url} />
                                <div>
                                    <h2>
                                        {member.name}{' '}
                                        {member.open_to_romance && (
                                            <span className="pond-heart-badge" title="Open to romantic connections" aria-label="Open to romantic connections">
                                                <Heart size={14} fill="currentColor" />
                                            </span>
                                        )}
                                    </h2>
                                    <p>@{member.username}</p>
                                    <span>◉ Member since {member.member_since}</span>
                                </div>
                                {isOwnProfile && (
                                    <Link href={edit()} className="pond-btn pond-btn-outline-dark">
                                        <Settings2 size={16} /> Edit profile
                                    </Link>
                                )}
                            </div>
                            {member.location && (
                                <p className="pond-member-location">
                                    <MapPin size={14} /> {member.location}
                                </p>
                            )}
                            {!isOwnProfile && (
                                <div className="pond-member-actions">
                                    <button className="pond-btn pond-btn-primary pond-wide" onClick={() => setGiving(true)}>
                                        <Sparkles size={16} /> Give {firstName} a Quantum Ball
                                    </button>
                                    {canSendSparkBall && (
                                        <button className="pond-btn pond-btn-soft pond-wide" onClick={() => setSparkInfo(true)}>
                                            <Heart size={16} /> Send a Spark Ball
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pond-profile-right">
                        <div className="pond-panel">
                            <div className="pond-panel-header">
                                <div>
                                    <h2>{isOwnProfile ? 'My story, in four little pieces' : `${firstName}'s story`}</h2>
                                    <p>Dreams, Fun, Treats and Boost.</p>
                                </div>
                            </div>
                            <div className="pond-story-list">
                                {categories.map(({ key, title, subtitle, icon: Icon, tone }) => (
                                    <section className="pond-story-item" key={key} aria-labelledby={`section-${key}`}>
                                        <div className={`pond-story-icon category-${tone}`}>
                                            <Icon size={21} />
                                        </div>
                                        <div>
                                            <div className="pond-story-title">
                                                <h3 id={`section-${key}`}>{title}</h3>
                                            </div>
                                            <small>{subtitle}</small>
                                            {member[key] ? (
                                                <p className="pond-story-text">{member[key]}</p>
                                            ) : (
                                                <p className="pond-story-empty">
                                                    {isOwnProfile ? 'Nothing here yet. Add something whenever you’re ready.' : `${firstName} hasn’t shared this yet.`}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </div>
                    </div>
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
