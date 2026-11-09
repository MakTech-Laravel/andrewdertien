<?php

use App\Enums\PondCategory;
use App\Models\Pond;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ponds now choose from golf balls as well as marbles, so the artwork is a named
 * key rather than a ball value. Existing ponds become their category's golf ball.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ponds', function (Blueprint $table) {
            $table->string('ball_art')->default(Pond::DEFAULT_ARTWORK)->after('price_cents');
        });

        foreach (PondCategory::cases() as $category) {
            DB::table('ponds')->where('category', $category->value)->update(['ball_art' => $category->golfBall()]);
        }

        Schema::table('ponds', function (Blueprint $table) {
            $table->dropColumn('ball_value');
        });
    }

    public function down(): void
    {
        Schema::table('ponds', function (Blueprint $table) {
            $table->unsignedInteger('ball_value')->default(100)->after('price_cents');
        });

        Schema::table('ponds', function (Blueprint $table) {
            $table->dropColumn('ball_art');
        });
    }
};
