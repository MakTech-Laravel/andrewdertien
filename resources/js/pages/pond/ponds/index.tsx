import { Head } from '@inertiajs/react';
import { Waves } from 'lucide-react';
import type { PondCard } from '@/components/pond/commerce';
import { PublicPondGrid } from '@/components/pond/public-pond-grid';
import { PublicShell } from '@/components/pond/public-shell';
import { EmptyState } from '@/components/pond/ui';

export default function PondsIndex({ ponds }: { ponds: PondCard[] }) {
    return (
        <>
            <Head title="The Ponds" />
            <PublicShell title="Find your pond" intro="There is room for everyone. Pick the one that feels like yours.">
                {ponds.length ? <PublicPondGrid ponds={ponds} /> : <EmptyState icon={<Waves size={25} />} title="The water is still" body="New ponds are on their way. Check back soon." />}
            </PublicShell>
        </>
    );
}
