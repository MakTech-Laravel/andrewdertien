<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marks purchases made while payments were in test mode, so they are never
     * mistaken for real money.
     */
    public function up(): void
    {
        Schema::table('pond_purchases', function (Blueprint $table) {
            $table->boolean('is_test')->default(false)->after('gateway_payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('pond_purchases', function (Blueprint $table) {
            $table->dropColumn('is_test');
        });
    }
};
