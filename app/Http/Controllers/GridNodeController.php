<?php

namespace App\Http\Controllers;

use App\Models\GridNode;
use Illuminate\Http\JsonResponse;

class GridNodeController extends Controller
{
    public function index(): JsonResponse
    {
        $nodes = GridNode::query()
            ->with('barangay:id,name,municipality')
            ->withCount([
                'incidents as active_incidents_count' => fn ($query) => $query->whereIn('status', ['verified', 'in_progress']),
            ])
            ->orderBy('code')
            ->get()
            ->map(fn (GridNode $node) => [
                'id' => $node->code,
                'name' => $node->name,
                'municipality' => $node->barangay?->municipality,
                'latitude' => $node->latitude,
                'longitude' => $node->longitude,
                'status' => match ($node->status) {
                    'outage' => 'outage',
                    'warning', 'pending' => 'unverified',
                    default => 'nominal',
                },
                'reports' => $node->incidents()->sum('affected_customers'),
                'crews' => $node->incidents()->where('status', 'in_progress')->count(),
                'type' => $node->type,
                'capacity_kw' => $node->capacity_kw,
                'active_incidents_count' => $node->active_incidents_count,
            ]);

        return response()->json(['data' => $nodes]);
    }
}
