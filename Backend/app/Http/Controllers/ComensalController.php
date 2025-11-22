<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Log;

class ComensalController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Validar si un código QR existe en la base de datos
     * Usado por la app Flutter para validar antes de abrir el WebView
     */
    public function validarQR($codigoQR)
    {
        try {
            Log::info('Validando código QR: ' . $codigoQR);

            // Buscar la mesa por código QR
            $mesaResponse = $this->supabase->select(
                'mesa',
                'id_mesa, numero_mesa, codigo_qr',
                ['codigo_qr' => 'eq.' . $codigoQR]
            );

            $mesas = $mesaResponse->json();
            
            Log::info('Resultado de búsqueda: ', ['mesas' => $mesas]);

            if (empty($mesas)) {
                return response()->json([
                    'success' => false,
                    'valido' => false,
                    'message' => 'Código QR no válido'
                ], 404)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type');
            }

            $mesa = $mesas[0];

            return response()->json([
                'success' => true,
                'valido' => true,
                'message' => 'Código QR válido',
                'numero_mesa' => $mesa['numero_mesa']
            ])
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type');

        } catch (\Exception $e) {
            Log::error('Error en validarQR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'valido' => false,
                'message' => 'Error al validar código QR',
                'error' => $e->getMessage()
            ], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type');
        }
    }

    /**
     * Obtener menú y datos de mesa por código QR
     */
    public function getMenuPorQR($codigoQR)
    {
        try {
            // Buscar la mesa por código QR
            $mesaResponse = $this->supabase->select(
                'mesa',
                'id_mesa, numero_mesa, id_restaurante, capacidad, estado',
                ['codigo_qr' => 'eq.' . $codigoQR]
            );

            $mesas = $mesaResponse->json();
            if (empty($mesas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código QR no válido'
                ], 404)->header('Access-Control-Allow-Origin', '*');
            }

            $mesa = $mesas[0];
            $idRestaurante = $mesa['id_restaurante'];

            // Obtener datos del restaurante
            $restauranteResponse = $this->supabase->select(
                'restaurantes',
                'id_restaurante, nombre, ubicacion',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );
            $restaurantes = $restauranteResponse->json();
            $restaurante = $restaurantes[0] ?? null;

            // Obtener el menú del restaurante
            $menuResponse = $this->supabase->select(
                'menu',
                'id_menu, nombre, descripcion, precio, categoria',
                ['id_restaurante' => 'eq.' . $idRestaurante]
            );
            $menu = $menuResponse->json();

            return response()->json([
                'success' => true,
                'mesa' => $mesa,
                'restaurante' => $restaurante,
                'menu' => $menu
            ])->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Error en getMenuPorQR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el menú',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    /**
     * Registrar pedido de comensal
     */
    public function registrarPedido(Request $request)
    {
        try {
            $codigoQR = $request->input('codigo_qr');
            $pedido = $request->input('pedido'); // Array de platillos
            $total = $request->input('total');

            // Buscar la mesa
            $mesaResponse = $this->supabase->select(
                'mesa',
                'id_mesa, id_restaurante',
                ['codigo_qr' => 'eq.' . $codigoQR]
            );
            $mesas = $mesaResponse->json();
            
            if (empty($mesas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mesa no encontrada'
                ], 404)->header('Access-Control-Allow-Origin', '*');
            }

            $mesa = $mesas[0];

            // Crear el pedido principal (simplificado - puedes crear cliente automático)
            $pedidoData = [
                'id_restaurante' => $mesa['id_restaurante'],
                'fecha_hora_pedido' => now()->toIso8601String(),
                'estado' => 'Pendiente',
                'total' => (float)$total,
                'numero_mesa' => $mesa['id_mesa']
            ];

            $pedidoResponse = $this->supabase->insert('pedidos', $pedidoData, true);

            if ($pedidoResponse->failed()) {
                throw new \Exception('Error al crear pedido: ' . $pedidoResponse->body());
            }

            $pedidoCreado = $pedidoResponse->json()[0] ?? null;
            $idPedido = $pedidoCreado['id_pedido'] ?? null;

            // Insertar detalles del pedido
            if ($idPedido) {
                $detalles = [];
                foreach ($pedido as $item) {
                    $detalles[] = [
                        'id_pedido' => $idPedido,
                        'id_menu' => $item['id_menu'],
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => (float)$item['precio']
                    ];
                }

                if (!empty($detalles)) {
                    $this->supabase->insert('detalle_pedido', $detalles);
                }
            }

            // Crear notificación para el cocinero
            $this->supabase->insert('atencion', [
                'tipo_solicitud' => 'Nuevo pedido',
                'fecha_hora_solicitud' => now()->toIso8601String(),
                'estado' => 'Pendiente',
                'id_mesa' => $mesa['id_mesa']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pedido registrado correctamente',
                'id_pedido' => $idPedido
            ])->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Error en registrarPedido: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar pedido',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    /**
     * Solicitar mesero
     */
    public function solicitarMesero(Request $request)
    {
        try {
            $codigoQR = $request->input('codigo_qr');

            $mesaResponse = $this->supabase->select(
                'mesa',
                'id_mesa',
                ['codigo_qr' => 'eq.' . $codigoQR]
            );
            $mesas = $mesaResponse->json();

            if (empty($mesas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mesa no encontrada'
                ], 404)->header('Access-Control-Allow-Origin', '*');
            }

            $mesa = $mesas[0];

            // Crear solicitud de atención
            $this->supabase->insert('atencion', [
                'tipo_solicitud' => 'Solicitar mesero',
                'fecha_hora_solicitud' => now()->toIso8601String(),
                'estado' => 'Pendiente',
                'id_mesa' => $mesa['id_mesa']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mesero notificado'
            ])->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Error en solicitarMesero: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al solicitar mesero'
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    /**
     * Solicitar cuenta para pagar
     */
    public function solicitarCuenta(Request $request)
    {
        try {
            $codigoQR = $request->input('codigo_qr');
            $metodoPago = $request->input('metodo_pago');
            $total = $request->input('total');

            $mesaResponse = $this->supabase->select(
                'mesa',
                'id_mesa',
                ['codigo_qr' => 'eq.' . $codigoQR]
            );
            $mesas = $mesaResponse->json();

            if (empty($mesas)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mesa no encontrada'
                ], 404)->header('Access-Control-Allow-Origin', '*');
            }

            $mesa = $mesas[0];

            // Crear solicitud de cuenta
            $this->supabase->insert('atencion', [
                'tipo_solicitud' => "Pagar - {$metodoPago}",
                'fecha_hora_solicitud' => now()->toIso8601String(),
                'estado' => 'Pendiente',
                'id_mesa' => $mesa['id_mesa'],
                'notas' => "Total: $" . $total
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Solicitud de pago enviada'
            ])->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Error en solicitarCuenta: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al solicitar cuenta'
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
}
