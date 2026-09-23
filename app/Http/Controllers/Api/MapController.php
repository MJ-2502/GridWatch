<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use Illuminate\Http\Request;

class MapController extends Controller
{
    public function status(Request $request)
    {
        // Fetch all barangays and EAGER LOAD their active incidents and pending reports
        $barangays = Barangay::with([
            'incidents' => function($query) {
                $query->whereIn('status', ['pending', 'in_progress', 'verified']);
            },
            'outageReports' => function($query) {
                $query->where('status', 'pending');
            }
        ])->get();

        $mapData = $barangays->map(function ($barangay) {
            // Default Status: GREEN (Normal)
            $status = 'normal';
            $color = '#22c55e'; 

            $outagesCount = $barangay->incidents->count();
            $reportsCount = $barangay->outageReports->count();

            // HYBRID LOGIC FOR MAP COLORS:
            // 1. If there is a Verified Incident (Hardware confirmed) -> RED
            if ($outagesCount > 0) {
                $status = 'outage';
                $color = '#ef4444'; // Red
            } 
            // 2. If there are pending public reports (Unverified) -> YELLOW
            elseif ($reportsCount > 0) {
                $status = 'warning';
                $color = '#eab308'; // Yellow
            }

            return [
                'id' => $barangay->id,
                'name' => $barangay->name,
                'municipality' => $barangay->municipality,
                'cooperative' => $barangay->cooperative,
                'boundary_reference' => $barangay->boundary_reference,
                'status' => $status,
                'color' => $color,
                'outages' => $outagesCount,
                'reports' => $reportsCount
            ];
        });

        return response()->json($mapData);
    }
}