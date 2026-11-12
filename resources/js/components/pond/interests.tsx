import { Coffee, Dumbbell, Gamepad2, Heart, Lightbulb, Music, Palette, PawPrint, Plane, TreePine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type InterestOption = { value: string; label: string };

const interestIcons: Record<string, LucideIcon> = {
    'art-and-creativity': Palette,
    music: Music,
    'food-and-coffee': Coffee,
    travel: Plane,
    animals: PawPrint,
    'nature-and-outdoors': TreePine,
    'sports-and-fitness': Dumbbell,
    gaming: Gamepad2,
    'business-and-ideas': Lightbulb,
    'giving-back': Heart,
};

/** Each interest keeps one soft colour wherever it appears, so chips read the same on every screen. */
const interestTones: Record<string, string> = {
    'art-and-creativity': 'orange',
    music: 'blue',
    'food-and-coffee': 'brown',
    travel: 'sky',
    animals: 'green',
    'nature-and-outdoors': 'green',
    'sports-and-fitness': 'blue',
    gaming: 'violet',
    'business-and-ideas': 'teal',
    'giving-back': 'pink',
};

export function interestTone(value: string): string {
    return interestTones[value] ?? 'blue';
}

export function InterestIcon({ value, size = 16 }: { value: string; size?: number }) {
    const Icon = interestIcons[value] ?? Heart;

    return <Icon size={size} aria-hidden="true" />;
}
