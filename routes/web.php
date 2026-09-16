<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
| Open to everyone. No auth, no session requirement.
*/

Route::view('/', 'portal')->name('portal');

/*
|--------------------------------------------------------------------------
| Dispatcher console
|--------------------------------------------------------------------------
| Breeze registers /login, /logout, /forgot-password, etc. in auth.php.
| We only override the login *view* so it renders our React page instead
| of Breeze's default Blade form. The POST /login handler stays Breeze's.
*/

Route::middleware('guest')->group(function () {
    Route::view('/login', 'auth.login')->name('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::view('/dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/auth.php';
