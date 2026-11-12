<?php

namespace App\Enums;

/**
 * The interests a member can pick in "Make a Splash!" and show on their profile.
 */
enum Interest: string
{
    case ART_AND_CREATIVITY = 'art-and-creativity';
    case MUSIC = 'music';
    case FOOD_AND_COFFEE = 'food-and-coffee';
    case TRAVEL = 'travel';
    case ANIMALS = 'animals';
    case NATURE_AND_OUTDOORS = 'nature-and-outdoors';
    case SPORTS_AND_FITNESS = 'sports-and-fitness';
    case GAMING = 'gaming';
    case BUSINESS_AND_IDEAS = 'business-and-ideas';
    case GIVING_BACK = 'giving-back';

    public function label(): string
    {
        return match ($this) {
            self::ART_AND_CREATIVITY => 'Art & Creativity',
            self::MUSIC => 'Music',
            self::FOOD_AND_COFFEE => 'Food & Coffee',
            self::TRAVEL => 'Travel',
            self::ANIMALS => 'Animals',
            self::NATURE_AND_OUTDOORS => 'Nature & Outdoors',
            self::SPORTS_AND_FITNESS => 'Sports & Fitness',
            self::GAMING => 'Gaming',
            self::BUSINESS_AND_IDEAS => 'Business & Ideas',
            self::GIVING_BACK => 'Giving Back',
        };
    }

    /**
     * Every interest as the value/label pairs the sign-up and profile forms render.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $interest): array => ['value' => $interest->value, 'label' => $interest->label()],
            self::cases(),
        );
    }
}
