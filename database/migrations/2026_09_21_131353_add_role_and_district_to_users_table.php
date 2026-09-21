<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'dispatcher', 'consumer', 'guest'])
                  ->default('guest')
                  ->after('email');
            $table->string('district')->nullable()->after('role'); // e.g. "Casiguran", "Juban"
            $table->boolean('is_verified')->default(false)->after('district');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'district', 'is_verified']);
        });
    }
};