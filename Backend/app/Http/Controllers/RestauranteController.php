<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RestauranteController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function registrar(Request $request)
    {
        // Validar los datos
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'ubicacion' => 'required|string|max:150',
            'gerente' => 'required|array',
            'gerente.nombre' => 'required|string|max:100',
            'gerente.correo_electronico' => 'required|email|max:100',
            'gerente.password' => 'required|string|min:6|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Preparar datos
            $restauranteData = [
                'nombre' => $request->nombre,
                'ubicacion' => $request->ubicacion
            ];

            $gerenteData = [
                'nombre' => $request->gerente['nombre'],
                'correo_electronico' => $request->gerente['correo_electronico'],
                'password' => bcrypt($request->gerente['password'])
            ];

            $menuItems = $request->input('menu', []);

            // Delegar la lógica de inserción al servicio Supabase
            $result = $this->supabase->registerFullRestaurant($restauranteData, $gerenteData, $menuItems);

            return response()->json([
                'message' => 'Restaurante registrado exitosamente',
                'data' => $result,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al registrar el restaurante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listar()
    {
        try {
            $restaurantes = $this->supabase->select('Restaurantes');
            return response()->json($restaurantes);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener los restaurantes',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}