<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash; 
use Illuminate\Support\Str;
use App\Services\SupabaseService;

class AuthController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function login(Request $request)
    {
        try {
            \Log::info('Solicitud de login recibida', [
                'datos_recibidos' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            $request->validate([
                'correo_electronico' => 'required|email',
                'password' => 'required'
            ]);
            
            \Log::info('Intento de login para: ' . $request->correo_electronico);

            // codigo para buscar en la tabla de Gerentes
            $gerenteResponse = $this->supabase->select(
                'gerentes',
                'gerentes.id_gerente, gerentes.nombre, gerentes.correo_electronico, gerentes.password, gerentes.id_restaurante', // Se quitaron los campos del join para simplificar la primera búsqueda
                ['correo_electronico' => $request->correo_electronico]
            );

            // codigo para buscar en la tabla de Meseros
            $meseroResponse = $this->supabase->select(
                'mesero',
                'mesero.id_mesero, mesero.nombre, mesero.correo_electronico, mesero.password, mesero.id_restaurante', // Se quitaron los campos del join
                ['correo_electronico' => $request->correo_electronico]
            );


            //  codigo para buscar en la tabla de Cocineros
            $cocineroResponse = $this->supabase->select(
                'cocinero',
                'id_cocinero, nombre, correo_electronico, password, id_restaurante',
                ['correo_electronico' => $request->correo_electronico]
            );

            //  codigo para buscar en la tabla de Administradores
            $adminResponse = $this->supabase->select(
                'administrador_app',
                'id_admin_app, nombre, correo_electronico, password, departamento',
                ['correo_electronico' => $request->correo_electronico]
            );

            $usuario = null;
            $tipo = null;
            
            $gerenteData = json_decode($gerenteResponse->body(), true);
            $meseroData = json_decode($meseroResponse->body(), true);
            $cocineroData = json_decode($cocineroResponse->body(), true);
            $adminData = json_decode($adminResponse->body(), true);

            if (!empty($gerenteData)) {
                $usuario = $gerenteData[0];
                $tipo = 'gerente';
            } elseif (!empty($meseroData)) {
                $usuario = $meseroData[0];
                $tipo = 'mesero';
            } elseif (!empty($cocineroData)) {
                $usuario = $cocineroData[0];
                $tipo = 'cocina';
            } elseif (!empty($adminData)) {
                $usuario = $adminData[0];
                $tipo = 'admin';
            }

            if (!$usuario) {
                \Log::warning('Usuario no encontrado: ' . $request->correo_electronico);
                return response()->json([
                    'message' => 'Credenciales incorrectas',
                    'detail' => 'Usuario no encontrado'
                ], 401);
            }

            // Esto compara la contraseña simple del request con el hash de la DB.
            if (!Hash::check($request->password, $usuario['password'])) {
                \Log::warning('Contraseña incorrecta para: ' . $request->correo_electronico);
                return response()->json([
                    'message' => 'Credenciales incorrectas',
                    'detail' => 'Contraseña incorrecta'
                ], 401);
            }

            // Generar token
            $token = Str::random(60);
            $userData = [];


            switch ($tipo) {
                case 'gerente':
                    $this->supabase->update('gerentes', $usuario['id_gerente'], ['remember_token' => $token]);
                    $restauranteResponse = $this->supabase->select(
                        'restaurantes',
                        'nombre, ubicacion',
                        ['id_restaurante' => 'eq.' . $usuario['id_restaurante']]
                    );
                    $restaurante = $restauranteResponse->json()[0];
                    $userData = [
                        'id' => $usuario['id_gerente'],
                        'tipo' => 'gerente',
                        'nombre' => $usuario['nombre'],
                        'correo' => $usuario['correo_electronico'],
                        'restaurante' => [
                            'id' => $usuario['id_restaurante'],
                            'nombre' => $restaurante['nombre'],
                            'ubicacion' => $restaurante['ubicacion']
                        ]
                    ];
                    break;

                case 'mesero':
                    $this->supabase->update('mesero', $usuario['id_mesero'], ['remember_token' => $token]);
                    $restauranteResponse = $this->supabase->select(
                        'restaurantes',
                        'nombre, ubicacion',
                        ['id_restaurante' => 'eq.' . $usuario['id_restaurante']]
                    );
                    $restaurante = $restauranteResponse->json()[0];
                    $userData = [
                        'id' => $usuario['id_mesero'],
                        'tipo' => 'mesero',
                        'nombre' => $usuario['nombre'],
                        'correo' => $usuario['correo_electronico'],
                        'restaurante' => [
                            'id' => $usuario['id_restaurante'],
                            'nombre' => $restaurante['nombre'],
                            'ubicacion' => $restaurante['ubicacion']
                        ]
                    ];
                    break;

                case 'cocina':
                    $this->supabase->update('cocinero', $usuario['id_cocinero'], ['remember_token' => $token]);
                    $restauranteResponse = $this->supabase->select(
                        'restaurantes',
                        'nombre, ubicacion',
                        ['id_restaurante' => 'eq.' . $usuario['id_restaurante']]
                    );
                    $restaurante = $restauranteResponse->json()[0];
                    $userData = [
                        'id' => $usuario['id_cocinero'],
                        'tipo' => 'cocina',
                        'nombre' => $usuario['nombre'],
                        'correo' => $usuario['correo_electronico'],
                        'restaurante' => [
                            'id' => $usuario['id_restaurante'],
                            'nombre' => $restaurante['nombre'],
                            'ubicacion' => $restaurante['ubicacion']
                        ]
                    ];
                    break;

                case 'admin':
                    $this->supabase->update('administrador_app', $usuario['id_admin_app'], ['remember_token' => $token]);
                    $userData = [
                        'id' => $usuario['id_admin_app'],
                        'tipo' => 'admin',
                        'nombre' => $usuario['nombre'],
                        'correo' => $usuario['correo_electronico'],
                        'departamento' => $usuario['departamento']
                    ];
                    break;
            }

            return response()->json([
                'token' => $token,
                'user' => $userData
            ]);

        } catch (\Exception $e) {
            \Log::error('Excepción crítica en login: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error en el servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}