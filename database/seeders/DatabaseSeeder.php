<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\GridNode;
use App\Models\Incident;
use App\Models\OutageReport;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $manager = User::updateOrCreate(
            ['email' => 'manager@gridwatch.test'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $operator = User::updateOrCreate(
            ['email' => 'operator@gridwatch.test'],
            [
                'name' => 'GridWatch Operator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $barangays = collect([
            ['name' => 'Central (Pob.)', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Central_Pob..geojson'],
            ['name' => 'Rizal', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Rizal.geojson'],
            ['name' => 'Casay', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Casay.geojson'],
            ['name' => 'Cogon', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Cogon.geojson'],
            ['name' => 'Adovis (Pob.)', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Adovis_Pob..geojson'],
            ['name' => 'Burgos', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Burgos.geojson'],
            ['name' => 'Inlagadian', 'municipality' => 'Casiguran', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Inlagadian.geojson'],
            ['name' => 'Barcelona Central', 'municipality' => 'Barcelona', 'boundary_reference' => 'Soreco_2/Barcelona Brgy/Central.geojson'],
            ['name' => 'Poblacion', 'municipality' => 'Gubat', 'boundary_reference' => 'Soreco_2/Gubat Brgy/Poblacion.geojson'],
        ])->mapWithKeys(function (array $data) {
            $barangay = Barangay::updateOrCreate(
                ['name' => $data['name'], 'municipality' => $data['municipality'], 'province' => 'Sorsogon'],
                ['boundary_reference' => $data['boundary_reference']],
            );

            return [$data['name'] => $barangay];
        });

        $nodes = collect([
            ['code' => 'TRF-006', 'name' => 'Central (Pob.)', 'type' => 'transformer', 'status' => 'outage', 'latitude' => 12.8735, 'longitude' => 124.0077, 'capacity_kw' => 250],
            ['code' => 'TRF-014', 'name' => 'Rizal', 'type' => 'pole', 'status' => 'outage', 'latitude' => 12.8786, 'longitude' => 124.0274, 'capacity_kw' => 150],
            ['code' => 'TRF-004', 'name' => 'Casay', 'type' => 'transformer', 'status' => 'warning', 'latitude' => 12.8375, 'longitude' => 124.0582, 'capacity_kw' => 200],
            ['code' => 'TRF-007', 'name' => 'Cogon', 'type' => 'transformer', 'status' => 'warning', 'latitude' => 12.8521, 'longitude' => 124.0390, 'capacity_kw' => 200],
            ['code' => 'TRF-001', 'name' => 'Adovis (Pob.)', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8659, 'longitude' => 124.0112, 'capacity_kw' => 250],
            ['code' => 'TRF-003', 'name' => 'Burgos', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8764, 'longitude' => 124.0461, 'capacity_kw' => 250],
            ['code' => 'TRF-010', 'name' => 'Inlagadian', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8136, 'longitude' => 124.0606, 'capacity_kw' => 200],
            ['code' => 'TRF-016', 'name' => 'San Isidro', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8466, 'longitude' => 124.0121, 'capacity_kw' => 200],
            ['code' => 'TRF-018', 'name' => 'San Pascual', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8792, 'longitude' => 124.0608, 'capacity_kw' => 250],
            ['code' => 'TRF-019', 'name' => 'Santa Cruz', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8987, 'longitude' => 124.0396, 'capacity_kw' => 200],
        ])->mapWithKeys(function (array $data) use ($barangays) {
            $node = GridNode::updateOrCreate(
                ['code' => $data['code']],
                $data + ['barangay_id' => $barangays->get($data['name'])?->id],
            );

            return [$data['code'] => $node];
        });

        $incidents = [
            ['reference' => 'INC-2026-001', 'grid_node_id' => $nodes['TRF-006']->id, 'barangay_id' => $barangays['Central (Pob.)']->id, 'reported_by' => $operator->id, 'verified_by' => $manager->id, 'title' => 'Central transformer interruption', 'description' => 'Complete power loss detected at transformer TRF-006.', 'status' => 'verified', 'cause' => 'Equipment failure', 'affected_customers' => 218, 'latitude' => 12.8735, 'longitude' => 124.0077, 'started_at' => now()->subMinutes(25), 'estimated_restoration_at' => now()->addHours(2)],
            ['reference' => 'INC-2026-002', 'grid_node_id' => $nodes['TRF-014']->id, 'barangay_id' => $barangays['Rizal']->id, 'reported_by' => $operator->id, 'title' => 'Rizal feeder outage', 'description' => 'Resident reports indicate a localized outage.', 'status' => 'in_progress', 'cause' => 'Unknown', 'affected_customers' => 143, 'latitude' => 12.8786, 'longitude' => 124.0274, 'started_at' => now()->subMinutes(18), 'estimated_restoration_at' => now()->addHours(1)],
        ];

        foreach ($incidents as $data) {
            $incident = Incident::updateOrCreate(['reference' => $data['reference']], $data);

            OutageReport::updateOrCreate(
                ['reference' => str_replace('INC-', 'RPT-', $data['reference'])],
                [
                    'incident_id' => $incident->id,
                    'barangay_id' => $data['barangay_id'],
                    'reporter_name' => 'Resident report',
                    'description' => $data['description'],
                    'status' => 'verified',
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'reported_at' => $data['started_at'],
                ],
            );
        }

    }
}
