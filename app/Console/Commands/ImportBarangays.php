<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportBarangays extends Command
{
    protected $signature = 'import:barangays';
    protected $description = 'Import all barangay names from GeoJSON files into the barangays table.';

    public function handle(): int
    {
        $geojsonRoot = resource_path('Soreco_Coverage_Geojson');
        $files = File::allFiles($geojsonRoot);
        
        $inserted = 0;
        $skipped = 0;
        
        foreach ($files as $file) {
            if ($file->getExtension() !== 'geojson') {
                continue;
            }
            
            $json = json_decode(file_get_contents($file->getPathname()), true);
            if (!$json || !isset($json['features'][0]['properties']['ADM4_EN'])) {
                $this->warn("Skipping file {$file->getPathname()} due to invalid or missing ADM4_EN.");
                $skipped++;
                continue;
            }
            
            $barangayName = trim($json['features'][0]['properties']['ADM4_EN']);
            $municipality = trim($json['features'][0]['properties']['ADM3_EN']);
            
            if (empty($barangayName) || empty($municipality)) {
                $this->warn("Skipping file {$file->getPathname()} due to missing name or municipality in properties.");
                $skipped++;
                continue;
            }
            
            // Determine cooperative based on folder structure
            $cooperative = 'SORECO 1'; // Default
            if (str_contains($file->getPathname(), 'Soreco_2')) {
                $cooperative = 'SORECO 2';
            }
            
            $boundary_reference = str_replace(resource_path('Soreco_Coverage_Geojson') . DIRECTORY_SEPARATOR, '', $file->getPathname());
            // Normalize slashes for db
            $boundary_reference = str_replace('\\', '/', $boundary_reference);
            
            // Insert if not exists
            $exists = DB::table('barangays')
                ->where('name', $barangayName)
                ->where('municipality', $municipality)
                ->exists();
                
            if ($exists) {
                // Let's update the boundary_reference just in case
                DB::table('barangays')
                    ->where('name', $barangayName)
                    ->where('municipality', $municipality)
                    ->update([
                        'boundary_reference' => $boundary_reference,
                        'cooperative' => $cooperative
                    ]);
                $skipped++;
                continue;
            }
            
            DB::table('barangays')->insert([
                'name' => $barangayName,
                'municipality' => $municipality,
                'province' => 'Sorsogon',
                'cooperative' => $cooperative,
                'boundary_reference' => $boundary_reference,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $inserted++;
        }
        
        $this->info("Import complete: {$inserted} inserted, {$skipped} skipped (already existed).");
        return 0;
    }
}
