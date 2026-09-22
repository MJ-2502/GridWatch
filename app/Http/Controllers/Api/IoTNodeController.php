<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GridNode;
use App\Models\Incident;
use App\Models\OutageReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class IoTNodeController extends Controller
{
    public function ping(Request $request)
    {
        // 1. Validate using the secure api_token instead of mac_address
        $validated = $request->validate([
            'api_token' => 'required|string',
            'status' => 'required|string|in:online,power_loss',
            'sensor_reading' => 'nullable|numeric'
        ]);

        // 2. Look up the hardware by its secure license token
        $node = GridNode::where('api_token', $validated['api_token'])->first();

        if (!$node) {
            return response()->json(['message' => 'Node not found or invalid hardware license.'], 401);
        }

        // 3. Update status
        $node->update([
            'status' => $validated['status'],
            'last_ping_at' => now(),
        ]);

        // 4. Trigger the Hybrid Logic if power is lost (Your excellent capstone logic!)
        if ($validated['status'] === 'power_loss') {
            $this->verifyOutageReports($node);
        }

        return response()->json([
            'message' => 'Ping received successfully',
            'node' => $node->code,
            'current_status' => $node->status
        ], 200);
    }

    /**
     * Cross-references the power loss with crowdsourced reports.
     */
    private function verifyOutageReports(GridNode $node)
    {
        // 1. Check if an active incident already exists for this node to avoid duplicates
        $existingIncident = Incident::where('grid_node_id', $node->id)
            ->whereIn('status', ['pending', 'in_progress', 'verified'])
            ->first();

        if ($existingIncident) {
            Log::info("Power loss reported by {$node->code}, but an active incident already exists.");
            return;
        }

        // 2. Look for pending crowdsourced reports in the same Barangay
        $pendingReports = OutageReport::where('barangay_id', $node->barangay_id)
            ->where('status', 'pending')
            ->get();

        // 3. Create the official Verified Incident
        $incident = Incident::create([
            'grid_node_id' => $node->id,
            'barangay_id' => $node->barangay_id,
            'reference' => 'INC-' . now()->format('Y') . '-' . strtoupper(Str::random(6)),
            'title' => "Verified Outage: {$node->name} ({$node->code})",
            'description' => 'System automatically verified power loss via IoT node following crowdsourced reports.',
            'status' => 'verified',
            'latitude' => $node->latitude,
            'longitude' => $node->longitude,
            'started_at' => now(),
        ]);

        // 4. If we found crowdsourced reports, link them to this incident and mark them verified!
        if ($pendingReports->count() > 0) {
            OutageReport::whereIn('id', $pendingReports->pluck('id'))->update([
                'incident_id' => $incident->id,
                'status' => 'verified',
            ]);
            
            Log::info("Hybrid Verification Success: Node {$node->code} verified {$pendingReports->count()} crowdsourced reports.");
        } else {
            Log::info("IoT Detection: Node {$node->code} detected power loss before any public reports were made.");
        }
    }
}