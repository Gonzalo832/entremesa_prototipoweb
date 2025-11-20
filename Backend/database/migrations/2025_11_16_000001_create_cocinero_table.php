<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('cocinero', function (Blueprint $table) {
            $table->id('id_cocinero');
            $table->unsignedBigInteger('id_restaurante');
            $table->string('nombre', 100);
            $table->string('correo_electronico', 100)->unique();
            $table->string('password', 100);
            $table->timestamps();
            $table->foreign('id_restaurante')->references('id_restaurante')->on('restaurantes')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cocinero');
    }
};