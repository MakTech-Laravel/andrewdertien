<?php

namespace App\Enums;

enum PondCategory: string
{
    case DREAMS = 'dreams';
    case FUN = 'fun';
    case TREATS = 'treats';
    case BOOST = 'boost';
    case CREATOR = 'creator';
    case FLIRT = 'flirt';

    public function label(): string
    {
        return match ($this) {
            self::DREAMS => 'Dreams',
            self::FUN => 'Fun',
            self::TREATS => 'Treats',
            self::BOOST => 'Boost',
            self::CREATOR => 'Support a Creator',
            self::FLIRT => 'Flirt',
        };
    }

    /**
     * The golf ball this category wears in the client's artwork.
     */
    public function golfBall(): string
    {
        return match ($this) {
            self::DREAMS => 'golf-violet',
            self::FUN => 'golf-sky',
            self::TREATS => 'golf-orange',
            self::BOOST => 'golf-lime',
            self::CREATOR => 'golf-pink',
            self::FLIRT => 'golf-rainbow',
        };
    }
}
