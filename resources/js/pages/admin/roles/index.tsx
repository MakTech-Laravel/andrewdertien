import { Head } from '@inertiajs/react';
import { KeyRound, Lock, Shield, Users } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { groupByGroup } from '@/types/admin';
import type { AdminRole } from '@/types/admin';

const roleSummaries: Record<string, string> = {
    admin: 'Runs the site: creates ponds, chooses what the website shows, manages members, and sees and refunds every payment.',
    user: 'A member: chooses and buys ponds, and sees their own ponds and payment history.',
};

export default function RolesIndex({ roles }: { roles: AdminRole[] }) {
    return (
        <>
            <Head title="Roles" />

            <div className="w-full space-y-6">
                <AdminPageHeader title="Roles" description="There are exactly two roles. They are fixed, so they cannot be added, renamed or removed." icon={Shield} />

                <div className="grid gap-6 lg:grid-cols-2">
                    {roles.map((role) => (
                        <section key={role.id} className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold capitalize">{role.name}</h2>
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Fixed role" />
                                <span className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" /> {role.users_count}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{roleSummaries[role.name]}</p>

                            <div className="mt-5 space-y-4">
                                {Object.entries(groupByGroup(role.permissions)).map(([group, permissions]) => (
                                    <div key={group}>
                                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            <KeyRound className="h-3 w-3" /> {group}
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {permissions.map((permission) => (
                                                <Badge key={permission.id} variant="secondary" className="font-mono text-xs font-normal">
                                                    {permission.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}
