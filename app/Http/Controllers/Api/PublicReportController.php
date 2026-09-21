<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutageReport;
use App\Models\GridNode;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PublicReportController extends Controller
{
    /**
     * Endpoint for the public to report a power outage.
     */
    public function store(Request $request)
    {
        // 1. Validate incoming citizen report
        $validated = $request->validate([
            'barangay_id' => 'required|exists:barangays,id',
            'reporter_name' => 'nullable|string|max:255',
            'reporter_contact' => 'nullable|string|max:255',
            'description' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $reference = 'RPT-' . now()->format('Y') . '-' . strtoupper(Str::random(6));

        // 2. Create the pending report
        $report = OutageReport::create([
            'barangay_id' => $validated['barangay_id'],
            'reference' => $reference,
            'reporter_name' => $validated['reporter_name'] ?? null,
            'reporter_contact' => $validated['reporter_contact'] ?? null,
            'description' => $validated['description'],
            'status' => 'pending', 
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'reported_at' => now(),
        ]);

        // 3. TWO-WAY HYBRID HOOK: Check the IoT Node instantly
        $this->checkIotStatus($report);

        // Refresh the report to get updated status if it was instantly verified
        $report->refresh();

        return response()->json([
            'message' => 'Report submitted successfully.',
            'reference' => $report->reference,
            'status' => $report->status
        ], 201);
    }

    /**
     * Instantly verifies the report if the local IoT node is already down.
     */
    private function checkIotStatus(OutageReport $report)
    {
        // Find the IoT node assigned to the reported barangay
        $node = GridNode::where('barangay_id', $report->barangay_id)->first();

        if ($node && $node->status === 'power_loss') {
            
            // Look for an active incident
            $incident = Incident::where('grid_node_id', $node->id)
                ->whereIn('status', ['pending', 'in_progress', 'verified'])
                ->first();

            // If an incident doesn't exist yet, generate one
            if (!$incident) {
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
            }

            // Link the citizen's report to the verified incident and mark it verified
            $report->update([
                'incident_id' => $incident->id,
                'status' => 'verified'
            ]);
            

            Log::info("Two-Way Verification: Report {$report->reference} auto-verified because Node {$node->code} was already reporting power loss.");
        }
    }
}