<?php

use Illuminate\Support\Facades\Route;

/*
| Public Routes
*/
Route::view('/', 'portal')->name('portal');

Route::middleware('guest')->group(function () {
    Route::view('/login', 'auth.login')->name('login');
});

/*
| Authenticated Shared Routes
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::view('/dashboard', 'dashboard')->name('dashboard');
});

/*
| Role Protected Route Groups
*/

// Admin Only (e.g. Create Dispatchers and assign them to districts)
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Route::post('/admin/create-dispatcher', [AdminController::class, 'storeDispatcher']);
});

// Dispatcher Only (e.g. Verify guests in their designated district)
Route::middleware(['auth', 'role:dispatcher,admin'])->group(function () {
    // Route::post('/dispatcher/verify-consumer/{user}', [DispatcherController::class, 'verifyConsumer']);
});

require __DIR__.'/auth.php';