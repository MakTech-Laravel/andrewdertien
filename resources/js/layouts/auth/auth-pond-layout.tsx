import { Brand, SectionEyebrow } from '@/components/pond/ui';
import type { AuthLayoutProps } from '@/types';

export default function AuthPondLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="pond-app pond-auth">
            <img
                src="/quantum/images/ball-500.png"
                alt=""
                className="pond-auth-orb pond-auth-orb-a"
            />
            <img
                src="/quantum/images/ball-20.png"
                alt=""
                className="pond-auth-orb pond-auth-orb-b"
            />
            <img
                src="/quantum/images/ball-5000.png"
                alt=""
                className="pond-auth-orb pond-auth-orb-c"
            />

            <Brand dark />

            <div className="pond-auth-card">
                <div className="pond-auth-head">
                    <SectionEyebrow>Ask Upon A Pond</SectionEyebrow>
                    <h1>{title}</h1>
                    {description && <p>{description}</p>}
                </div>
                {children}
            </div>

            <p className="pond-auth-tagline">
                <strong>
                    Imagine your asks have <em>already been answered.</em>
                </strong>
                Sign up while feeling that feeling. Come on in!
            </p>
        </div>
    );
}
