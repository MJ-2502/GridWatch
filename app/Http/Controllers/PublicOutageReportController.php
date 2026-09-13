<?php

namespace App\Http\Controllers;

use App\Models\OutageReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicOutageReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barangay_id' => ['nullable', 'exists:barangays,id'],
            'reporter_name' => ['nullable', 'string', 'max:120'],
            'reporter_contact' => ['nullable', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $report = OutageReport::create([
            ...$validated,
            'reference' => 'GW-R-'.Str::upper(Str::random(8)),
            'reported_at' => now(),
        ]);

        return response()->json([
            'message' => 'Your outage report has been received.',
            'data' => [
                'reference' => $report->reference,
                'status' => $report->status,
                'reported_at' => $report->reported_at,
            ],
        ], 201);
    }
}
