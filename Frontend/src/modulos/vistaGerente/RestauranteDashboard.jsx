import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import './RestauranteDashboard.css';

function RestauranteDashboard() {
    const { user } = useAuth();
    const { id } = useParams();

    if (!user || user.restaurante.id !== parseInt(id)) {
        return <div>No autorizado</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Dashboard de {user.restaurante.nombre}</h1>
            <div className="dashboard-info">
                <p>Bienvenido, {user.nombre}</p>
                <p>Ubicación: {user.restaurante.ubicacion}</p>
            </div>
            <div className="dashboard-actions">
                <button className="dashboard-button">Gestionar Menú</button>
                <button className="dashboard-button">Ver Mesas</button>
                <button className="dashboard-button">Estadísticas</button>
            </div>
        </div>
    );
}

export default RestauranteDashboard;