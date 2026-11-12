import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Droplets, Gift, MessageCircle, Sun } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { InterestIcon, interestTone } from '@/components/pond/interests';
import type { InterestOption } from '@/components/pond/interests';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { store } from '@/routes/splash';

type Props = {
    interestOptions: InterestOption[];
    profile: {
        interests: string[];
        dreams: string | null;
        treats: string | null;
        about: string | null;
    };
};

export default function Splash({ interestOptions, profile }: Props) {
    const [selected, setSelected] = useState<string[]>(profile.interests);

    const toggle = (value: string) => {
        setSelected((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
    };

    return (
        <>
            <Head title="Make a Splash" />
            <Form {...store.form()} disableWhileProcessing className="pond-splash">
                {({ processing, errors }) => (
                    <>
                        <section className="pond-splash-block" aria-labelledby="splash-interests">
                            <h2 id="splash-interests">What are you into?</h2>
                            <p>Choose as many as you like.</p>
                            <div className="pond-chip-grid">
                                {interestOptions.map((option) => (
                                    <label key={option.value} className={`pond-chip pond-chip-${interestTone(option.value)} ${selected.includes(option.value) ? 'is-selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            name="interests[]"
                                            value={option.value}
                                            checked={selected.includes(option.value)}
                                            onChange={() => toggle(option.value)}
                                        />
                                        <InterestIcon value={option.value} size={15} />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.interests} />
                        </section>

                        <label className="pond-splash-question">
                            <span className="pond-splash-icon">
                                <Sun size={20} />
                            </span>
                            <span className="pond-splash-prompt">If you were living your dream life, what would it look like?</span>
                            <textarea
                                name="dreams"
                                rows={3}
                                maxLength={1000}
                                defaultValue={profile.dreams ?? ''}
                                placeholder="A little place by the ocean, traveling the world, starting my own business..."
                            />
                            <InputError message={errors.dreams} />
                        </label>

                        <label className="pond-splash-question">
                            <span className="pond-splash-icon">
                                <Gift size={20} />
                            </span>
                            <span className="pond-splash-prompt">If someone randomly bought you a ________, it would make your day!</span>
                            <input type="text" name="treats" maxLength={1000} defaultValue={profile.treats ?? ''} placeholder="A cup of coffee, a book, a pizza..." />
                            <InputError message={errors.treats} />
                        </label>

                        <label className="pond-splash-question">
                            <span className="pond-splash-icon">
                                <MessageCircle size={20} />
                            </span>
                            <span className="pond-splash-prompt">Anything else you&rsquo;d like people to know?</span>
                            <textarea name="about" rows={3} maxLength={1000} defaultValue={profile.about ?? ''} placeholder="A little something about yourself..." />
                            <InputError message={errors.about} />
                        </label>

                        <div className="pond-splash-actions">
                            <Button type="submit" data-test="splash-continue-button">
                                {processing ? <Spinner /> : <Droplets size={16} />}
                                Continue to the Pond
                                {!processing && <ArrowRight size={16} />}
                            </Button>
                            <Link href={dashboard()} className="pond-splash-skip" data-test="splash-skip-link">
                                Skip for now
                            </Link>
                        </div>
                        <p className="pond-splash-note">All questions optional &middot; Skip for now</p>
                    </>
                )}
            </Form>
        </>
    );
}

Splash.layout = {
    step: 'Step 2 of 2',
    title: 'Make a Splash!',
    description: 'A little about you. Answer whatever you like. You can always come back later.',
    wide: true,
};
