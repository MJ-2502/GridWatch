<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Http\JsonResponse;

class PublicIncidentController extends Controller
{
    public function index(): JsonResponse
    {
        $incidents = Incident::query()
            ->with(['barangay:id,name,municipality', 'gridNode:id,code,name,type'])
            ->whereIn('status', ['verified', 'in_progress'])
            ->latest('started_at')
            ->get();

        $now = now();
        $start = $now->copy()->subHours(23)->startOfHour();

        $reportCounts = \App\Models\OutageReport::query()
            ->where('reported_at', '>=', $start)
            ->selectRaw('DATE_FORMAT(reported_at, "%Y-%m-%d %H:00:00") as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->pluck('count', 'hour');

        $hourlyHistory = [];
        for ($i = 23; $i >= 0; $i--) {
            $hourString = $now->copy()->subHours($i)->format('Y-m-d H:00:00');
            $hourlyHistory[] = $reportCounts->get($hourString, 0);
        }

        return response()->json([
            'data' => $incidents,
            'meta' => [
                'hourly_reports' => $hourlyHistory,
            ],
        ]);
    }

    public function show(string $reference): JsonResponse
    {
        $incident = Incident::query()
            ->with(['barangay:id,name,municipality', 'gridNode:id,code,name,type'])
            ->where('reference', $reference)
            ->whereIn('status', ['verified', 'in_progress', 'restored'])
            ->firstOrFail();

        return response()->json(['data' => $incident]);
    }
}
