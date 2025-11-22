<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RestauranteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GerenteDashboardController;
use App\Http\Controllers\ComensalController;

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
Route::options('/restaurantes', function(\Illuminate\Http\Request $request) {
    $origin = $request->header('Origin', 'http://localhost:5173');
    return response()->json([], 200, [
        'Access-Control-Allow-Origin' => $origin,
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With'
    ]);
});

// Rutas protegidas
// Ruta pública para validar QR desde Flutter
Route::get('/validar-qr/{codigo_qr}', [ComensalController::class, 'validarQR']);

Route::middleware('api')->group(function () {
    Route::post('/restaurantes', [RestauranteController::class, 'registrar']);
    Route::get('/restaurantes', [RestauranteController::class, 'listar']);
    Route::post('/mesero', [App\Http\Controllers\UserManagementController::class, 'registrarMesero']);
    Route::get('/mesero/{id}', [App\Http\Controllers\UserManagementController::class, 'getMesero']);
    Route::delete('/mesero/{id}', [App\Http\Controllers\UserManagementController::class, 'deleteMesero']);
    Route::get('/cocinero/{id}', [App\Http\Controllers\UserManagementController::class, 'getCocinero']);
    Route::post('/cocinero', [App\Http\Controllers\UserManagementController::class, 'registrarCocinero']);
    Route::delete('/cocinero/{id}', [App\Http\Controllers\UserManagementController::class, 'deleteCocinero']);
    
    // Rutas del dashboard del gerente
    Route::get('/restaurante/{id}/stats', [GerenteDashboardController::class, 'getStats']);
    Route::get('/restaurante/{id}/mesas', [GerenteDashboardController::class, 'getMesas']);
    Route::get('/restaurante/{id}/menu', [GerenteDashboardController::class, 'getMenu']);
    Route::get('/restaurante/{id}/empleados', [GerenteDashboardController::class, 'getEmpleados']);
    Route::get('/restaurante/{id}/qr-codes', [GerenteDashboardController::class, 'getQRCodes']);
    
    // Rutas de menú
    Route::post('/menu', [GerenteDashboardController::class, 'addMenu']);
    Route::put('/menu/{id}', [GerenteDashboardController::class, 'updateMenu']);
    Route::delete('/menu/{id}', [GerenteDashboardController::class, 'deleteMenu']);
    
    // Rutas de comensal (público)
    Route::get('/menu-comensal/{codigo_qr}', [ComensalController::class, 'getMenuPorQR']);
    Route::post('/pedido-comensal', [ComensalController::class, 'registrarPedido']);
    Route::post('/solicitar-mesero', [ComensalController::class, 'solicitarMesero']);
    Route::post('/solicitar-cuenta', [ComensalController::class, 'solicitarCuenta']);
});