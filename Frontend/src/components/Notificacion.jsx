import React from 'react';
import './NotificacionEstilo.css';

function Notificacion({ mensaje, tipo = 'success' }) {
  return (
    <div className={`notificacion ${tipo}`}>
      {mensaje}
    </div>
  );
}

export default Notificacion;