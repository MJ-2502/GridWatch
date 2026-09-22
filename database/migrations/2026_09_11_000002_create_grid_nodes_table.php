<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grid_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique(); // Can be used as human-readable ID
            $table->string('mac_address')->unique()->nullable(); // The physical IoT hardware ID
            $table->string('api_token', 64)->unique()->nullable();
            $table->string('name');
            $table->string('type')->default('substation');
            $table->string('status')->default('online'); // e.g., online, offline, power_loss
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('capacity_kw')->nullable();
            $table->timestamp('last_ping_at')->nullable(); //for IoT verification
            $table->timestamps();

            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_nodes');
    }
};
