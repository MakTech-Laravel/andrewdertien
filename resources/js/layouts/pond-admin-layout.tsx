import type { ReactNode } from 'react';
import { PondShell } from '@/components/pond/ui';
import type { BreadcrumbItem } from '@/types';

/**
 * Puts the access-management pages (users, roles, permissions) inside the same
 * shell as the rest of the admin dashboard. Those pages render their own heading.
 */
export default function PondAdminLayout({ children, breadcrumbs = [] }: { children: ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <PondShell page={breadcrumbs.at(-1)?.title ?? 'Admin'} demo={false} hideHeading>
            <div className="pd-access-page">{children}</div>
        </PondShell>
    );
}
