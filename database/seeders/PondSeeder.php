<?php

namespace Database\Seeders;

use App\Enums\PondCategory;
use App\Models\Pond;
use Illuminate\Database\Seeder;

/**
 * Starter ponds so a fresh install has something to show. Admins can edit or
 * remove them from the admin dashboard.
 */
class PondSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->ponds() as $index => $pond) {
            Pond::firstOrCreate(['name' => $pond['name']], [
                ...$pond,
                'is_published' => true,
                'show_on_frontend' => true,
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * @return array<int, array{name: string, tagline: string, description: string, category: PondCategory, price_cents: int, ball_value: int}>
     */
    private function ponds(): array
    {
        return [
            ['name' => 'Dream Pond', 'tagline' => 'Help me make something possible.', 'description' => 'A pond for dreams, goals and aspirations, whether big or small.', 'category' => PondCategory::DREAMS, 'price_cents' => 10000, 'ball_value' => 100],
            ['name' => 'Fun Pond', 'tagline' => 'Help support me in enjoying an experience.', 'description' => 'A pond for hobbies, interests and experiences you would love to have.', 'category' => PondCategory::FUN, 'price_cents' => 2000, 'ball_value' => 10],
            ['name' => 'Treats Pond', 'tagline' => 'Perhaps a coffee, lunch, or something small.', 'description' => 'A pond for everyday little pleasures, such as coffee, a meal or a gallon of gas.', 'category' => PondCategory::TREATS, 'price_cents' => 500, 'ball_value' => 50],
            ['name' => 'Boost Pond', 'tagline' => 'I get by with a little help from my friends.', 'description' => 'A pond for when a little help would make a difference: groceries, transportation, bills.', 'category' => PondCategory::BOOST, 'price_cents' => 5000, 'ball_value' => 20],
        ];
    }
}
