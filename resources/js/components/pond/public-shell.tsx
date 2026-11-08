import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from '@/components/pond/ui';
import { dashboard, home, login, register } from '@/routes';
import { index as pondsIndex } from '@/routes/ponds';

/**
 * The navigation actions on the public website, aware of who is logged in.
 */
export function PublicNavActions() {
    const { auth } = usePage().props;

    return auth?.user ? (
        <Link href={dashboard()} className="askupon-btn askupon-btn-pink">
            My dashboard <ArrowRight size={16} />
        </Link>
    ) : (
        <>
            <Link href={login()} className="askupon-login">
                Log in
            </Link>
            <Link href={register()} className="askupon-btn askupon-btn-pink">
                Join the Pond <ArrowRight size={16} />
            </Link>
        </>
    );
}

export function PublicShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
    return (
        <div className="pond-home askupon-home pd-public">
            <header className="pd-public-header">
                <nav className="askupon-nav">
                    <Brand dark />
                    <div className="askupon-nav-actions">
                        <PublicNavActions />
                    </div>
                </nav>
                <div className="pd-public-title">
                    <h1>{title}</h1>
                    {intro && <p>{intro}</p>}
                </div>
            </header>
            <main className="pd-public-main">{children}</main>
            <footer className="askupon-footer">
                <Brand />
                <span>© 2026 Ask Upon A Pond · askuponapond.com</span>
                <div>
                    <Link href={home()}>Home</Link>
                    <Link href={pondsIndex()}>The Ponds</Link>
                </div>
            </footer>
        </div>
    );
}
