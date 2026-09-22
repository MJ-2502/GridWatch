<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutageReport;
use App\Models\GridNode;
use App\Models\Incident;
use App\Models\Barangay;
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
        // 1. Validate incoming string payload from React
        $validated = $request->validate([
            'barangay' => 'required|string',
            'municipality' => 'required|string',
            'issueType' => 'required|string',
            'accountNo' => 'nullable|string',
            'remarks' => 'nullable|string'
        ]);

        // 2. Look up the Barangay ID based on the string names sent by React
        $barangayModel = Barangay::where('name', $validated['barangay'])
            ->where('municipality', $validated['municipality'])
            ->first();

        if (!$barangayModel) {
            return response()->json(['error' => 'Service area not recognized.'], 404);
        }

        $reference = 'RPT-' . now()->format('Y') . '-' . strtoupper(Str::random(6));

        // 3. Create the pending report
        $report = OutageReport::create([
            'user_id' => auth()->id(), // Attach user if logged in
            'barangay_id' => $barangayModel->id,
            'reference' => $reference,
            'reporter_contact' => $validated['accountNo'] ?? null,
            // Combine issue type and remarks into the description
            'description' => $validated['issueType'] . ($validated['remarks'] ? ' - ' . $validated['remarks'] : ''),
            'status' => 'pending', 
            'latitude' => $barangayModel->latitude,
            'longitude' => $barangayModel->longitude,
            'reported_at' => now(),
        ]);

        // 4. TWO-WAY HYBRID HOOK: Group into Incident & Check IoT
        $this->processIncidentGrouping($report, $barangayModel);

        $report->refresh();

        return response()->json([
            'message' => 'Report submitted successfully.',
            'reference' => $report->reference,
            'status' => $report->status
        ], 201);
    }

    /**
     * Instantly verifies the report if the local IoT node is already down, 
     * or groups it into an Isolated Fault if hardware is online.
     */
    private function processIncidentGrouping(OutageReport $report, Barangay $barangay)
    {
        $node = GridNode::where('barangay_id', $report->barangay_id)->first();
        $isHardwareOffline = $node && $node->status === 'power_loss';

        // Check if a ticket already exists for this area (US-08 Grouping)
        $incident = Incident::where('barangay_id', $report->barangay_id)
            ->whereIn('status', ['pending', 'in_progress', 'verified'])
            ->first();

        // If no incident exists, create the master ticket
        if (!$incident) {
            $incident = Incident::create([
                'grid_node_id' => $node?->id,
                'barangay_id' => $report->barangay_id,
                'reference' => 'INC-' . now()->format('Y') . '-' . strtoupper(Str::random(6)),
                
                // US-07: Hardware offline = Verified. US-06: Hardware online = Isolated Fault.
                'title' => $isHardwareOffline ? "Verified Outage: {$node->name}" : "Isolated Fault: {$barangay->name}",
                'description' => $isHardwareOffline 
                    ? 'System automatically verified power loss via IoT node following crowdsourced reports.'
                    : 'Citizen report received, but hardware sensor reports nominal power. Possible isolated line drop.',
                
                'status' => $isHardwareOffline ? 'verified' : 'pending',
                'latitude' => $node?->latitude ?? $barangay->latitude,
                'longitude' => $node?->longitude ?? $barangay->longitude,
                'started_at' => now(),
            ]);
        } 
        // If ticket exists but hardware JUST dropped, upgrade it to Verified
        elseif ($isHardwareOffline && $incident->status === 'pending') {
            $incident->update([
                'status' => 'verified',
                'title' => "Verified Outage: {$node->name}",
            ]);
        }

        // Link the citizen's report to the incident ticket
        $report->update([
            'incident_id' => $incident->id,
            'status' => $incident->status === 'verified' ? 'verified' : 'pending'
        ]);

        if ($isHardwareOffline) {
            Log::info("Two-Way Verification: Report {$report->reference} verified. Node {$node->code} is offline.");
        }
    }
}