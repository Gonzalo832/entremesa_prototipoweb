<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\SupabaseService;

class GerenteDashboardController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function getStats($idRestaurante)
    {
        try {
            // Total de ventas del día
            $ventasResponse = $this->supabase->select(
                'pedidos',
                'SUM(total) as total_ventas',
                [
                    'id_restaurante' => 'eq.' . $idRestaurante,
                    'fecha_hora_pedido' => 'gte.' . date('Y-m-d') . 'T00:00:00'
                ]
            );
            $ventas = $ventasResponse->json()[0] ?? ['total_ventas' => 0];

            // Mesas disponibles y ocupadas
            $mesasResponse = $this->supabase->select(
                'mesa',
                'estado',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );
            $mesas = $mesasResponse->json();
            
            $mesasDisponibles = count(array_filter($mesas, fn($m) => $m['estado'] === 'Disponible'));
            $mesasOcupadas = count(array_filter($mesas, fn($m) => $m['estado'] === 'Ocupada'));

            // Pedidos del día
            $pedidosResponse = $this->supabase->select(
                'pedidos',
                'COUNT(*) as total',
                [
                    'id_restaurante' => 'eq.' . $idRestaurante,
                    'fecha_hora_pedido' => 'gte.' . date('Y-m-d') . 'T00:00:00'
                ]
            );
            $pedidos = $pedidosResponse->json()[0] ?? ['total' => 0];

            return response()->json([
                'success' => true,
                'data' => [
                    'totalVentas' => $ventas['total_ventas'] ?? 0,
                    'mesasDisponibles' => $mesasDisponibles,
                    'mesasOcupadas' => $mesasOcupadas,
                    'pedidosHoy' => $pedidos['total'] ?? 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMesas($idRestaurante)
    {
        try {
            $response = $this->supabase->select(
                'mesa',
                '*',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );

            return response()->json([
                'success' => true,
                'data' => $response->json()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener mesas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMenu($idRestaurante)
    {
        try {
            $response = $this->supabase->select(
                'menu',
                '*',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );

            return response()->json([
                'success' => true,
                'data' => $response->json()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener menú',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEmpleados($idRestaurante)
    {
        try {
            $meserosResponse = $this->supabase->select(
                'mesero',
                '*',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );

            $cocinerosResponse = $this->supabase->select(
                'cocinero',
                '*',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'meseros' => $meserosResponse->json(),
                    'cocineros' => $cocinerosResponse->json()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener empleados',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getQRCodes($idRestaurante)
    {
        try {
            $response = $this->supabase->select(
                'mesa',
                'id_mesa, numero_mesa, codigo_qr',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );

            $mesas = $response->json();
            
            // Aquí puedes generar URLs para los QR codes o devolverlos si ya están almacenados
            $qrData = array_map(function($mesa) {
                return [
                    'id_mesa' => $mesa['id_mesa'],
                    'numero_mesa' => $mesa['numero_mesa'],
                    'qr_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($mesa['codigo_qr'])
                ];
            }, $mesas);

            return response()->json([
                'success' => true,
                'data' => $qrData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener códigos QR',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addMenu(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_restaurante' => 'required|integer',
                'nombre' => 'required|string|max:100',
                'descripcion' => 'nullable|string|max:255',
                'precio' => 'required|numeric|min:0',
                'categoria' => 'required|string|max:50'
            ]);

            $response = $this->supabase->insert('menu', $validated, true);

            if ($response->failed()) {
                throw new \Exception($response->body());
            }

            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'success' => true,
                'message' => 'Platillo agregado correctamente',
                'data' => $response->json()[0] ?? null
            ], 201)->header('Access-Control-Allow-Origin', $origin);
        } catch (\Exception $e) {
            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar platillo',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', $origin);
        }
    }

    public function updateMenu(Request $request, $idMenu)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:100',
                'descripcion' => 'nullable|string|max:255',
                'precio' => 'required|numeric|min:0',
                'categoria' => 'required|string|max:50'
            ]);

            $response = $this->supabase->update('menu', $idMenu, $validated);

            if ($response->failed()) {
                throw new \Exception($response->body());
            }

            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'success' => true,
                'message' => 'Platillo actualizado correctamente'
            ])->header('Access-Control-Allow-Origin', $origin);
        } catch (\Exception $e) {
            $origin = $request->header('Origin', 'http://localhost:5173');
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar platillo',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', $origin);
        }
    }

    public function deleteMenu($idMenu)
    {
        try {
            $this->supabase->delete('menu', $idMenu);
            
            return response()->json([
                'success' => true,
                'message' => 'Platillo eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar platillo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
