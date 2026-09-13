<?php

use App\Http\Controllers\PublicIncidentController;
use App\Http\Controllers\PublicOutageReportController;
use App\Http\Controllers\GridNodeController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->name('api.public.')->group(function () {
    Route::get('/incidents', [PublicIncidentController::class, 'index'])->name('incidents.index');
    Route::get('/incidents/{reference}', [PublicIncidentController::class, 'show'])->name('incidents.show');
    Route::post('/outage-reports', [PublicOutageReportController::class, 'store'])->name('outage-reports.store');
});

Route::get('/grid-nodes', [GridNodeController::class, 'index'])->name('api.grid-nodes.index');
