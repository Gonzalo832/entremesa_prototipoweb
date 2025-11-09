import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './styleRegistroExito.css';

function RegistroExito() {
  const location = useLocation();
  const { nombreRestaurante, qrUrl } = location.state || {};

  if (!nombreRestaurante) {
    return (
      <div className="registro-exito-container error">
        <h2>Error de Navegación</h2>
        <p>No se encontró información del registro.</p>
        <Link to="/registrar-restaurante" className="button">Volver al Registro</Link>
      </div>
    );
  }

  return (
    <div className="registro-exito-container">
      <h2>¡Registro Exitoso!</h2>
      <p>El restaurante <strong>{nombreRestaurante}</strong> ha sido registrado correctamente.</p>
      
      <div className="qr-section">
        <h3>QR para Menú Digital</h3>
        <p className="qr-url">{qrUrl}</p>
        <Link to="/" className="button">Ir al Inicio</Link>
      </div>
    </div>
  );
}

export default RegistroExito;