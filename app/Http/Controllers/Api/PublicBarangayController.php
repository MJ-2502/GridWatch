<?php

namespace App\Http\Controllers\Api;

use App\Models\Barangay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PublicBarangayController extends Controller
{
    /**
     * Return a list of barangay names for the given municipality.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $municipality = $request->query('municipality');
        if (!$municipality) {
            return response()->json(['data' => []]);
        }

        $names = Barangay::where('municipality', $municipality)
            ->orderBy('name')
            ->pluck('name');

        return response()->json($names);
    }
}
