<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RestauranteController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/test', function() {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas
Route::middleware('api')->group(function () {
    Route::post('/restaurantes', [RestauranteController::class, 'registrar']);
    Route::get('/restaurantes', [RestauranteController::class, 'listar']);
});