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
        if ($request->getMethod() === 'OPTIONS') {
            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([], 200)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }

        \Log::info('Datos recibidos para registro de restaurante:', $request->all());

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'ubicacion' => 'required|string|max:150',
            'num_mesas' => 'nullable|integer|min:1|max:100',
            'gerente' => 'required|array',
            'gerente.nombre' => 'required|string|max:100',
            'gerente.correo_electronico' => 'required|email|max:100',
            'gerente.password' => 'required|string|min:6|max:100',
            'menu' => 'nullable|array',
            'menu.*.nombre' => 'required|string|max:100',
            'menu.*.descripcion' => 'nullable|string|max:255',
            'menu.*.precio' => 'required|numeric|min:0',
            'menu.*.categoria' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            \Log::warning('Validación fallida:', $validator->errors()->toArray());
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
            $numMesas = $request->input('num_mesas', 1);

            \Log::info("Procesando restaurante con {$numMesas} mesas y " . count($menuItems) . " platillos");

            // Delegar la lógica de inserción al servicio Supabase
            $result = $this->supabase->registerFullRestaurant($restauranteData, $gerenteData, $menuItems, $numMesas);

            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'message' => 'Restaurante registrado exitosamente',
                'data' => $result,
            ], 201)->header('Access-Control-Allow-Origin', $origin)
                   ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                   ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            \Log::error('Error al registrar restaurante: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'message' => 'Error al registrar el restaurante',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', $origin)
                   ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                   ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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