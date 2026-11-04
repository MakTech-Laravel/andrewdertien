<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 30)->nullable()->unique()->after('name');
            $table->string('location', 100)->nullable()->after('avatar');
            $table->date('date_of_birth')->nullable()->after('location');
            $table->text('dreams')->nullable()->after('date_of_birth');
            $table->text('fun')->nullable()->after('dreams');
            $table->text('treats')->nullable()->after('fun');
            $table->text('boost')->nullable()->after('treats');
            $table->boolean('open_to_romance')->default(false)->after('boost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn([
                'username',
                'location',
                'date_of_birth',
                'dreams',
                'fun',
                'treats',
                'boost',
                'open_to_romance',
            ]);
        });
    }
};
