<?php

use App\Http\Controllers\PublicIncidentController;
use App\Http\Controllers\PublicOutageReportController;
use App\Http\Controllers\GridNodeController;
use App\Http\Controllers\Api\IoTNodeController;
use App\Http\Controllers\Api\PublicReportController;
use App\Http\Controllers\Api\MapController;
use Illuminate\Support\Facades\Route;


Route::prefix('public')->name('api.public.')->group(function () {
    Route::get('/incidents', [PublicIncidentController::class, 'index'])->name('incidents.index');
    Route::get('/incidents/{reference}', [PublicIncidentController::class, 'show'])->name('incidents.show');
    Route::post('/outage-reports', [PublicOutageReportController::class, 'store'])->name('outage-reports.store');
});

Route::get('/grid-nodes', [GridNodeController::class, 'index'])->name('api.grid-nodes.index');

Route::post('/iot/ping', [IoTNodeController::class, 'ping']);

Route::post('/public/reports', [PublicReportController::class, 'store']);

Route::get('/map/status', [MapController::class, 'status']);

Route::any('/iot/test-connection', function () {
    return response('SUCCESS', 200);
});

// Fetch exact barangay names for the public reporting dropdown
Route::get('/public/barangays', function (\Illuminate\Http\Request $request) {
    return \App\Models\Barangay::where('municipality', $request->query('municipality'))
        ->orderBy('name')->pluck('name');
});