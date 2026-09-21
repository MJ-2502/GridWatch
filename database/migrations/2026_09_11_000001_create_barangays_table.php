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
            $table->string('cooperative'); // e.g., 'SORECO 1' or 'SORECO 2'
            $table->string('boundary_reference')->nullable(); // Good for linking GeoJSON files
            $table->timestamps();

            // Ensure that each combination of name, municipality, and cooperative is unique
            $table->unique(['name', 'municipality', 'cooperative']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};
