<?php

namespace Database\Factories;

use App\Enums\PondCategory;
use App\Models\Pond;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pond>
 */
class PondFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->unique()->words(2, true)).' Pond',
            'tagline' => fake()->sentence(5),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(PondCategory::cases()),
            'price_cents' => fake()->numberBetween(500, 50000),
            'ball_art' => 'golf-'.fake()->randomElement(Pond::GOLF_BALLS),
            'is_published' => true,
            'show_on_frontend' => true,
        ];
    }

    public function draft(): static
    {
        return $this->state(['is_published' => false, 'show_on_frontend' => false]);
    }

    public function hiddenFromFrontend(): static
    {
        return $this->state(['show_on_frontend' => false]);
    }
}
