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

    public function run(): void
    {
        // 1. Admin (Full system access)
        $manager = User::updateOrCreate(
            ['email' => 'manager@gridwatch.test'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin',
                'district' => null,
                'is_verified' => true,
            ],
        );

        // 2. Dispatcher (Locked to Casiguran)
        $operator = User::updateOrCreate(
            ['email' => 'operator@gridwatch.test'],
            [
                'name' => 'Casiguran Dispatch',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'dispatcher',
                'district' => 'Casiguran',
                'is_verified' => true,
            ],
        );

        // 3. Verified Consumer (View only, can report)
        $consumer = User::updateOrCreate(
            ['email' => 'consumer@gridwatch.test'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'consumer',
                'district' => 'Casiguran',
                'is_verified' => true,
            ],
        );

        // 4. Unverified Guest (Waiting for approval)
        $guest = User::updateOrCreate(
            ['email' => 'guest@gridwatch.test'],
            [
                'name' => 'New Resident',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'guest',
                'district' => 'Casiguran',
                'is_verified' => false,
            ],
        );

        $barangays = collect([
            ['name' => 'Central (Pob.)', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Central_Pob..geojson'],
            ['name' => 'Rizal', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Rizal.geojson'],
            ['name' => 'Casay', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Casay.geojson'],
            ['name' => 'Cogon', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Cogon.geojson'],
            ['name' => 'Adovis (Pob.)', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Adovis_Pob..geojson'],
            ['name' => 'Burgos', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Burgos.geojson'],
            ['name' => 'Inlagadian', 'municipality' => 'Casiguran', 'cooperative' => 'SORECO 1', 'boundary_reference' => 'Soreco_1/Casiguran Brgy/Inlagadian.geojson'],
            ['name' => 'Barcelona Central', 'municipality' => 'Barcelona', 'cooperative' => 'SORECO 2', 'boundary_reference' => 'Soreco_2/Barcelona Brgy/Central.geojson'],
            ['name' => 'Poblacion', 'municipality' => 'Gubat', 'cooperative' => 'SORECO 2', 'boundary_reference' => 'Soreco_2/Gubat Brgy/Poblacion.geojson'],
        ])->mapWithKeys(function (array $data) {
            $barangay = Barangay::updateOrCreate(
                ['name' => $data['name'], 'municipality' => $data['municipality'], 'province' => 'Sorsogon', 'cooperative' => $data['cooperative']],
                ['boundary_reference' => $data['boundary_reference']],
            );

            return [$data['name'] => $barangay];
        });

        $nodes = collect([
            ['code' => 'TRF-006', 'mac_address' => 'AA:BB:CC:DD:EE:01', 'name' => 'Central (Pob.)', 'type' => 'transformer', 'status' => 'power_loss', 'latitude' => 12.8735, 'longitude' => 124.0077, 'capacity_kw' => 250],
            ['code' => 'TRF-014', 'mac_address' => 'AA:BB:CC:DD:EE:02', 'name' => 'Rizal', 'type' => 'pole', 'status' => 'power_loss', 'latitude' => 12.8786, 'longitude' => 124.0274, 'capacity_kw' => 150],
            ['code' => 'TRF-004', 'mac_address' => 'AA:BB:CC:DD:EE:03', 'name' => 'Casay', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8375, 'longitude' => 124.0582, 'capacity_kw' => 200],
            ['code' => 'TRF-007', 'mac_address' => 'AA:BB:CC:DD:EE:04', 'name' => 'Cogon', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8521, 'longitude' => 124.0390, 'capacity_kw' => 200],
            ['code' => 'TRF-001', 'mac_address' => 'AA:BB:CC:DD:EE:05', 'name' => 'Adovis (Pob.)', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8659, 'longitude' => 124.0112, 'capacity_kw' => 250],
            ['code' => 'TRF-003', 'mac_address' => 'AA:BB:CC:DD:EE:06', 'name' => 'Burgos', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8764, 'longitude' => 124.0461, 'capacity_kw' => 250],
            ['code' => 'TRF-010', 'mac_address' => 'AA:BB:CC:DD:EE:07', 'name' => 'Inlagadian', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8136, 'longitude' => 124.0606, 'capacity_kw' => 200],
            ['code' => 'TRF-016', 'mac_address' => 'AA:BB:CC:DD:EE:08', 'name' => 'San Isidro', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8466, 'longitude' => 124.0121, 'capacity_kw' => 200],
            ['code' => 'TRF-018', 'mac_address' => 'AA:BB:CC:DD:EE:09', 'name' => 'San Pascual', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8792, 'longitude' => 124.0608, 'capacity_kw' => 250],
            ['code' => 'TRF-019', 'mac_address' => 'AA:BB:CC:DD:EE:10', 'name' => 'Santa Cruz', 'type' => 'transformer', 'status' => 'online', 'latitude' => 12.8987, 'longitude' => 124.0396, 'capacity_kw' => 200],
        ])->mapWithKeys(function (array $data) use ($barangays) {
            $node = GridNode::updateOrCreate(
                ['code' => $data['code']],
                $data + ['barangay_id' => $barangays->get($data['name'])?->id, 'last_ping_at' => now()],
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