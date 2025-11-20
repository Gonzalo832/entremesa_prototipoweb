<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    public function getMesero($id)
    {
        $mesero = DB::table('mesero')->where('id_mesero', $id)->first();
        if (!$mesero) {
            return response()->json(['success' => false, 'message' => 'Mesero no encontrado'], 404);
        }

        $solicitudes = DB::table('atencion')->where('id_mesero', $id)->get();
        $pedidos = DB::table('pedidos')->where('id_restaurante', $mesero->id_restaurante)->get();
        $mesas = DB::table('mesa')->where('id_restaurante', $mesero->id_restaurante)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'id_mesero' => $mesero->id_mesero,
                'nombre' => $mesero->nombre,
                'correo_electronico' => $mesero->correo_electronico,
                'solicitudes' => $solicitudes,
                'pedidos' => $pedidos,
                'mesas' => $mesas,
            ]
        ]);
    }

    public function getCocinero($id)
    {
        $cocinero = DB::table('cocinero')->where('id_cocinero', $id)->first();
        if (!$cocinero) {
            return response()->json(['success' => false, 'message' => 'Cocinero no encontrado'], 404);
        }

        $pedidos = DB::table('pedidos')->where('id_restaurante', $cocinero->id_restaurante)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'id_cocinero' => $cocinero->id_cocinero,
                'nombre' => $cocinero->nombre,
                'correo_electronico' => $cocinero->correo_electronico,
                'pedidos' => $pedidos,
            ]
        ]);
    }

    public function registrarMesero(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'correo_electronico' => 'required|email|max:100',
            'password' => 'required|string|min:6',
            'id_restaurante' => 'required|integer',
        ]);

        $existe = DB::table('mesero')->where('correo_electronico', $request->correo_electronico)->exists();
        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'El correo electrónico ya está registrado.'
            ], 409);
        }

        $meseroId = DB::table('mesero')->insertGetId([
            'nombre' => $request->nombre,
            'correo_electronico' => $request->correo_electronico,
            'password' => Hash::make($request->password),
            'id_restaurante' => $request->id_restaurante,
        ], 'id_mesero');

        return response()->json([
            'success' => true,
            'id_mesero' => $meseroId,
            'message' => 'Mesero registrado correctamente'
        ], 201);
    }

    public function registrarCocinero(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'correo_electronico' => 'required|email|max:100',
            'password' => 'required|string|min:6',
            'id_restaurante' => 'required|integer',
        ]);

        $existe = DB::table('cocinero')->where('correo_electronico', $request->correo_electronico)->exists();
        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'El correo electrónico ya está registrado.'
            ], 409);
        }

        $cocineroId = DB::table('cocinero')->insertGetId([
            'nombre' => $request->nombre,
            'correo_electronico' => $request->correo_electronico,
            'password' => Hash::make($request->password),
            'id_restaurante' => $request->id_restaurante,
        ], 'id_cocinero');

        return response()->json([
            'success' => true,
            'id_cocinero' => $cocineroId,
            'message' => 'Cocinero registrado correctamente'
        ], 201);
    }
}