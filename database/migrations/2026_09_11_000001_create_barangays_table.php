<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('municipality');
            $table->string('province')->default('Sorsogon');
            $table->string('boundary_reference')->nullable();
            $table->timestamps();

            $table->unique(['name', 'municipality', 'province']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
