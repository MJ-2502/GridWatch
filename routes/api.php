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
    Route::post('/reports', [PublicReportController::class, 'store'])->name('public.reports.store');
});

Route::get('/grid-nodes', [GridNodeController::class, 'index'])->name('api.grid-nodes.index');

Route::post('/iot/ping', [IoTNodeController::class, 'ping']);



Route::get('/map/status', [MapController::class, 'status']);

Route::any('/iot/test-connection', function () {
    return response('SUCCESS', 200);
});

// Fetch exact barangay names for the public reporting dropdown using a dedicated controller
use App\Http\Controllers\Api\PublicBarangayController;
Route::get('/public/barangays', [PublicBarangayController::class, 'index'])->name('public.barangays.index');