<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
/*
|--------------------------------------------------------------------------
| Public Portal
|--------------------------------------------------------------------------
*/
Route::view('/', 'portal')->name('portal');

Route::middleware('guest')->group(function () {
    Route::view('/login', 'auth.login')->name('login');
});

/*
|--------------------------------------------------------------------------
| Authenticated Route Dispatcher
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        // Use the Facade to make VS Code happy!
        $user = \Illuminate\Support\Facades\Auth::user();

        // Check the role property directly
        if ($user->role === 'admin' || $user->role === 'dispatcher') {
            return view('dashboard');
        }

        // Guests and Consumers are redirected to the Public Portal
        return redirect()->route('portal');
    })->name('dashboard');

    // Protect dashboard APIs using the session and RBAC
    Route::middleware('role:admin,dispatcher')->prefix('api')->group(function () {
        Route::get('/grid-nodes', [\App\Http\Controllers\GridNodeController::class, 'index'])->name('api.grid-nodes.index');
        Route::get('/map/status', [\App\Http\Controllers\Api\MapController::class, 'status']);
    });
});

Route::get('/quick-logout', function (\Illuminate\Http\Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/');
});
require __DIR__.'/auth.php';