import { Form, Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Camera, Check, Heart, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MemberProfileController from '@/actions/App/Http/Controllers/MemberProfileController';
import { categories } from '@/components/pond/data';
import type { MemberProfile } from '@/components/pond/data';
import { Avatar, hueFor, PondShell } from '@/components/pond/ui';
import { show } from '@/routes/members';

type EditableProfile = MemberProfile & {
    has_date_of_birth: boolean;
    is_adult: boolean;
};

function FieldError({ message }: { message?: string }) {
    return message ? <p className="pond-field-error">{message}</p> : null;
}

export default function ProfileEdit({ profile }: { profile: EditableProfile }) {
    const [openToRomance, setOpenToRomance] = useState(profile.open_to_romance);
    const romanceLocked = profile.has_date_of_birth && !profile.is_adult;

    return (
        <>
            <Head title="Edit my profile" />
            <PondShell
                page="My profile"
                subheading="Your story is what makes this community special."
                demo={false}
                action={
                    profile.username ? (
                        <Link href={show(profile.username)} className="pond-btn pond-btn-primary">
                            View my public profile <ArrowUpRight size={16} />
                        </Link>
                    ) : null
                }
            >
                <div className="pond-profile-grid">
                    <div className="pond-profile-left">
                        <div className="pond-profile-cover">
                            <div className="pond-profile-cover-orb">
                                <img src="/quantum/images/ball-5000.png" alt="" />
                            </div>
                        </div>
                        <div className="pond-profile-card">
                            <div className="pond-profile-identity">
                                <Avatar name={profile.name} hue={hueFor(profile.id)} size="avatar-profile" src={profile.avatar_url} />
                                <div>
                                    <h2>{profile.name}</h2>
                                    <p>{profile.username ? `@${profile.username}` : 'Choose a username below'}</p>
                                    <span>◉ Member since {profile.member_since}</span>
                                </div>
                            </div>

                            <Form
                                {...MemberProfileController.updateAvatar.form()}
                                options={{ preserveScroll: true }}
                                resetOnSuccess
                                className="pond-avatar-actions"
                            >
                                {({ processing, errors, submit }) => (
                                    <>
                                        <label className="pond-btn pond-btn-outline-dark">
                                            <Camera size={16} /> {processing ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Add a photo'}
                                            <input
                                                type="file"
                                                name="avatar"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="sr-only"
                                                disabled={processing}
                                                onChange={() => submit()}
                                            />
                                        </label>
                                        <FieldError message={errors.avatar} />
                                    </>
                                )}
                            </Form>
                            {profile.avatar_url && (
                                <Form {...MemberProfileController.destroyAvatar.form()} options={{ preserveScroll: true }}>
                                    {({ processing }) => (
                                        <button type="submit" className="pond-text-btn pond-remove-photo" disabled={processing}>
                                            <Trash2 size={14} /> Remove photo
                                        </button>
                                    )}
                                </Form>
                            )}
                        </div>

                        <div className="pond-panel pond-profile-tip">
                            <span>✦ A GENTLE REMINDER</span>
                            <h3>Your story doesn't have to be perfect.</h3>
                            <p>Every section is optional. Leave any of them blank and come back whenever you like.</p>
                        </div>
                    </div>

                    <Form
                        {...MemberProfileController.update.form()}
                        options={{ preserveScroll: true }}
                        className="pond-profile-right"
                    >
                        {({ processing, errors, recentlySuccessful }) => (
                            <>
                                <div className="pond-panel">
                                    <div className="pond-panel-header">
                                        <div>
                                            <h2>The basics</h2>
                                            <p>Your email and password stay private.</p>
                                        </div>
                                    </div>
                                    <div className="pond-form-two">
                                        <label className="pond-form-label">
                                            Display name
                                            <input className="pond-input" name="name" defaultValue={profile.name} required maxLength={255} autoComplete="name" />
                                            <FieldError message={errors.name} />
                                        </label>
                                        <label className="pond-form-label">
                                            Username
                                            <input
                                                className="pond-input"
                                                name="username"
                                                defaultValue={profile.username ?? ''}
                                                required
                                                minLength={3}
                                                maxLength={30}
                                                pattern="[A-Za-z0-9_]+"
                                                title="Letters, numbers and underscores only"
                                                autoComplete="username"
                                            />
                                            <FieldError message={errors.username} />
                                        </label>
                                    </div>
                                    <label className="pond-form-label">
                                        Location <span className="pond-optional">(optional, such as your city)</span>
                                        <input className="pond-input" name="location" defaultValue={profile.location ?? ''} maxLength={100} autoComplete="address-level2" />
                                        <FieldError message={errors.location} />
                                    </label>
                                </div>

                                <div className="pond-panel">
                                    <div className="pond-panel-header">
                                        <div>
                                            <h2>My story, in four little pieces</h2>
                                            <p>Share who you are and what matters to you, with no pressure to ask for anything.</p>
                                        </div>
                                    </div>
                                    <div className="pond-story-list">
                                        {categories.map(({ key, title, subtitle, description, placeholder, icon: Icon, tone }) => (
                                            <div className="pond-story-item" key={key}>
                                                <div className={`pond-story-icon category-${tone}`}>
                                                    <Icon size={21} />
                                                </div>
                                                <label className="pond-story-field">
                                                    <div className="pond-story-title">
                                                        <h3>{title}</h3>
                                                    </div>
                                                    <small>
                                                        <strong>{subtitle}</strong> {description}
                                                    </small>
                                                    <textarea
                                                        className="pond-textarea"
                                                        name={key}
                                                        rows={3}
                                                        maxLength={1000}
                                                        defaultValue={profile[key] ?? ''}
                                                        placeholder={placeholder}
                                                    />
                                                    <FieldError message={errors[key]} />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pond-panel pond-profile-romance">
                                    <div className="pond-romance-heading">
                                        <span>
                                            <Heart size={18} />
                                        </span>
                                        <div>
                                            <h3>Romantic Connections</h3>
                                            <p>Optional · Adults 18+ only</p>
                                        </div>
                                    </div>
                                    <p>
                                        If you switch this on, a small heart appears on your profile and other adult members can send you a Spark Ball.
                                        Receiving one never obliges you to reply. This is not a dating platform.
                                    </p>
                                    <label className="pond-toggle-line">
                                        <span>I’m open to romantic connections.</span>
                                        <input
                                            type="checkbox"
                                            name="open_to_romance"
                                            value="1"
                                            checked={openToRomance}
                                            disabled={romanceLocked}
                                            onChange={(e) => setOpenToRomance(e.target.checked)}
                                        />
                                        <span className="pond-toggle-ui" />
                                    </label>
                                    {romanceLocked && (
                                        <div className="pond-form-note">Romantic Connections is only available to members aged 18 or older.</div>
                                    )}
                                    {openToRomance && !profile.has_date_of_birth && (
                                        <label className="pond-form-label">
                                            Date of birth
                                            <input className="pond-input" type="date" name="date_of_birth" required autoComplete="bday" />
                                            <span className="pond-optional">Used only to confirm you are 18 or older. Never shown on your profile, and it can’t be changed later.</span>
                                            <FieldError message={errors.date_of_birth} />
                                        </label>
                                    )}
                                    <FieldError message={errors.open_to_romance} />
                                    {profile.open_to_romance && profile.is_adult && (
                                        <span className="pond-verified-pill">
                                            <ShieldCheck size={14} /> Heart showing on your profile
                                        </span>
                                    )}
                                </div>

                                <div className="pond-save-bar">
                                    {recentlySuccessful && (
                                        <span className="pond-saved-note">
                                            <Check size={15} /> Saved
                                        </span>
                                    )}
                                    <button type="submit" className="pond-btn pond-btn-primary" disabled={processing}>
                                        <Check size={16} /> {processing ? 'Saving…' : 'Save my profile'}
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </PondShell>
        </>
    );
}
