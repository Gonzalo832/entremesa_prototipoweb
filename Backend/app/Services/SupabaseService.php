<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SupabaseService
{
    protected $supabaseUrl;
    protected $supabaseKey;
    protected $headers;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url');
        $this->supabaseKey = config('services.supabase.key');
        $this->headers = [
            'apikey' => $this->supabaseKey,
            'Authorization' => 'Bearer ' . $this->supabaseKey,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation' 
        ];
    }

    protected function request($method, $table, $params = [], $prefer = 'return=minimal')
    {
        $base = trim($this->supabaseUrl);
        $base = rtrim($base, '/');
        $url = "{$base}/rest/v1/{$table}";
        
        $currentHeaders = $this->headers;
        if ($prefer !== 'return=minimal') {
            $currentHeaders['Prefer'] = $prefer;
        }

        // Log para depuración local 
        \Log::debug('SupabaseService request', [
            'url' => $url,
            'method' => $method,
            'headers' => array_keys($currentHeaders),
            'params_preview' => is_array($params) ? array_slice($params, 0, 5) : $params,
        ]);

        return Http::withHeaders($currentHeaders)
            ->withOptions(['verify' => false]) 
            ->$method($url, $params);
    }

    public function select($table, $select = '*', $filters = [])
    {
        $base = trim($this->supabaseUrl);
        $base = rtrim($base, '/');
        $url = "{$base}/rest/v1/{$table}";

        // Construir la URL con los filtros
        $queryParams = [];
        foreach ($filters as $column => $value) {
            if (strpos($value, 'eq.') === 0) {
                $queryParams[] = $column . "=eq." . urlencode(substr($value, 3));
            } else {
                $queryParams[] = $column . "=eq." . urlencode($value);
            }
        }

        if (!empty($queryParams)) {
            $url .= '?' . implode('&', $queryParams);
        }

        \Log::debug('SupabaseService URL:', ['url' => $url]);

        return Http::withHeaders($this->headers)
            ->withOptions(['verify' => false])
            ->get($url);
    }

    /**
     * Inserta datos, permitiendo especificar si se desea que Supabase devuelva la data.
     * Por defecto usa 'return=minimal' para eficiencia, pero se puede forzar 'return=representation'
     * @param string $table Nombre de la tabla
     * @param array $data Datos a insertar
     * @param bool $returnRepresentation Si es true, añade Prefer: return=representation.
     * @return \Illuminate\Http\Client\Response
     */
    public function insert($table, $data, $returnRepresentation = false)
    {
        $prefer = $returnRepresentation ? 'return=representation' : 'return=minimal';
        return $this->request('post', $table, $data, $prefer);
    }

    public function update($table, $id, $data)
    {
         return $this->request('patch', "{$table}?id=eq.{$id}", $data);
    }

    public function delete($table, $id)
    {
        return $this->request('delete', "{$table}?id=eq.{$id}");
    }

    /**
     * Genera un código QR único (UUID v4) 
     * @return string
     */
    protected function generateUniqueQrCode(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * @param string $qrCode El código único generado.
     * @return string
     */
    protected function getMenuUrl(string $qrCode): string
    {
        // Esta es la URL que tu frontend o API usará para resolver el menú.
        return "http://localhost:3000/menu/{$qrCode}";
    }
    
    /**
     * Ejecuta la inserción del restaurante, gerente, menú, y las mesas con QR.
     * @param array $restauranteData Datos del restaurante (nombre, ubicacion)
     * @param array $gerenteData Datos del gerente (nombre, correo, password)
     * @param array $menuItems Lista de platillos del menú
     * @param int $numMesas Número de mesas a crear
     * @return array
     * @throws \Exception
     */
    public function registerFullRestaurant(array $restauranteData, array $gerenteData, array $menuItems, int $numMesas = 1): array
    {
        // 1. GENERAR CÓDIGO QR ÚNICO PARA LA PRIMERA MESA
        $qrCode = $this->generateUniqueQrCode();
        $menuUrl = $this->getMenuUrl($qrCode);
        
        // Codigi para insertar Restaurante y obtener el ID 
    $restauranteResponse = $this->insert('restaurantes', $restauranteData, true); 

        if ($restauranteResponse->failed()) {
            throw new \Exception("Error al insertar Restaurante: " . $restauranteResponse->body());
        }
        $restauranteResult = $restauranteResponse->json(); 
        $id_restaurante = $restauranteResult[0]['id_restaurante'] ?? null;

        if (!$id_restaurante) {
            throw new \Exception("No se pudo obtener el ID del restaurante insertado.");
        }
        
        // Codigo para insertar Gerente 
        $gerenteData['id_restaurante'] = $id_restaurante;
    $gerenteResponse = $this->insert('gerentes', $gerenteData);

        if ($gerenteResponse->failed()) {
            throw new \Exception("Error al insertar Gerente: " . $gerenteResponse->body());
        }

        // Codigo para insertar múltiples Mesas con códigos QR únicos
        $mesasInserts = [];
        for ($i = 1; $i <= $numMesas; $i++) {
            $mesaQrCode = $this->generateUniqueQrCode();
            $mesasInserts[] = [
                'id_restaurante' => $id_restaurante,
                'numero_mesa' => str_pad($i, 3, '0', STR_PAD_LEFT), // 001, 002, 003, etc.
                'codigo_qr' => $mesaQrCode,
                'capacidad' => 4,
                'estado' => 'Disponible'
            ];
        }

        if (!empty($mesasInserts)) {
            $mesaResponse = $this->insert('mesa', $mesasInserts);

            if ($mesaResponse->failed()) {
                \Log::error('Error al insertar Mesas: ' . $mesaResponse->body());
                throw new \Exception("Error al insertar Mesas: " . $mesaResponse->body());
            }
        }

        // Codigo para insertar los platillos del Menú (Inserción Múltiple)
        $menuInserts = [];
        foreach ($menuItems as $item) {
            $menuInserts[] = [
                'id_restaurante' => $id_restaurante,
                'nombre' => $item['nombre'],
                'descripcion' => $item['descripcion'] ?? null,
                'precio' => (float)$item['precio'],
                'categoria' => $item['categoria']
            ];
        }
        if (!empty($menuInserts)) {
            $menuResponse = $this->insert('menu', $menuInserts);

            if ($menuResponse->failed()) {
                \Log::error('Error al insertar menú: ' . $menuResponse->body());
                throw new \Exception("Error al insertar Menú: " . $menuResponse->body());
            }
        }

        // Generar la imagen del QR de la primera mesa
        $primerMesaQrCode = $mesasInserts[0]['codigo_qr'];
        $primerMesaUrl = $this->getMenuUrl($primerMesaQrCode);
        
        $qrImage = QrCode::format('png')
            ->size(300)
            ->margin(1)
            ->errorCorrection('H')
            ->generate($primerMesaUrl);
        
        // Convertir la imagen a base64
        $qrImageBase64 = 'data:image/png;base64,' . base64_encode($qrImage);

        // Retorno del resultado 
        return [
            'id_restaurante' => $id_restaurante,
            'num_mesas_creadas' => count($mesasInserts),
            'qr_code_url' => $primerMesaUrl,
            'qr_code_key' => $primerMesaQrCode,
            'qr_image' => $qrImageBase64
        ];
    }
}