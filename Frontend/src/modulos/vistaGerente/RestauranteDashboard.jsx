import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import './RestauranteDashboard.css';
import MeseroForm from './MeseroForm.jsx';
import CocineroForm from './CocineroForm.jsx';

function RestauranteDashboard() {
    const { user } = useAuth();
    const { id } = useParams();

    if (!user || user.restaurante.id !== parseInt(id)) {
        return <div>No autorizado</div>;
    }

    const [showMeseroForm, setShowMeseroForm] = React.useState(false);
    const [showCocineroForm, setShowCocineroForm] = React.useState(false);

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
                <button className="dashboard-button" onClick={() => setShowMeseroForm(true)}>Agregar Mesero</button>
                <button className="dashboard-button" onClick={() => setShowCocineroForm(true)}>Agregar Cocinero</button>
            </div>

            {showMeseroForm && (
                <MeseroForm restauranteId={user.restaurante.id} onClose={() => setShowMeseroForm(false)} />
            )}
            {showCocineroForm && (
                <CocineroForm restauranteId={user.restaurante.id} onClose={() => setShowCocineroForm(false)} />
            )}
        </div>
    );
}

export default RestauranteDashboard;