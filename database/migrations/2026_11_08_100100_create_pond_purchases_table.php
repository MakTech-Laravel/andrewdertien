<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pond_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            // Financial records outlive the account: the buyer is snapshotted below.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('pond_id')->constrained()->restrictOnDelete();
            $table->string('buyer_name');
            $table->string('buyer_email');
            $table->string('pond_name');
            $table->unsignedBigInteger('amount_cents');
            $table->string('currency', 3);
            $table->string('status')->default('pending')->index();
            $table->string('gateway');
            $table->string('gateway_session_id')->nullable()->unique();
            $table->string('gateway_payment_id')->nullable()->index();
            $table->string('failure_message')->nullable();
            $table->timestamp('paid_at')->nullable()->index();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'pond_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pond_purchases');
    }
};
