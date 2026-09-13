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

        return response()->json(['data' => $incidents]);
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
