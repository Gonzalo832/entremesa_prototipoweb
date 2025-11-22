import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUtensils, faUser, faBell, faClipboardList, faChair, 
    faCheckCircle, faExclamationCircle, faReceipt, faHandPaper, 
    faTable, faCheck, faShoppingCart, faHashtag, faEye, faTh, faUsers 
} from '@fortawesome/free-solid-svg-icons';
import './vista_mesero.css';

const calcularTiempoEspera = (fechaHoraSolicitud) => {
  const tiempo = new Date().getTime() - new Date(fechaHoraSolicitud).getTime();
  const minutos = Math.floor(tiempo / 60000);
  return minutos > 0 ? `${minutos} min` : 'Ahora';
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN', 
      minimumFractionDigits: 2,
    }).format(amount).replace('MX$', '$');
};


const StatCard = ({ title, value, icon, type }) => (
    <div className={`stat-card ${type}`}>
        <div className="stat-header">
            <div className="stat-title">{title}</div>
            <div className="stat-icon">
                <FontAwesomeIcon icon={icon} />
            </div>
        </div>
        <div className="stat-value">{value}</div>
    </div>
);

const MeseroView = () => {
    const { user } = useAuth();
    const { id } = useParams(); 
    const API_URL = 'http://172.20.10.2:8000/api/mesero/' + id;
    const [data, setData] = useState({ 
        id_mesero: 0,
        solicitudes: [], 
        pedidos: [], 
        mesas: [] 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    if (!user || user.id !== parseInt(id) || user.tipo !== 'mesero') {
        return <div>No autorizado</div>;
    }

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.message || 'Error al obtener datos de la API');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Error al conectar con el backend. Revisar la URL de la API.');
            setData(prev => ({ ...prev, solicitudes: [], pedidos: [], mesas: [] }));
        } finally {
            setLoading(false);
        }
    }, []);

    const atenderSolicitud = async (idAtencion) => {
        if (!window.confirm('¿Desea atender esta solicitud y marcarla como lista?')) {
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_atencion: idAtencion, id_mesero: data.id_mesero }),
            });

            const result = await response.json();

            if (result.success) {
                fetchData();
            } else {
                alert(`Error: ${result.message || 'No se pudo atender la solicitud'}`);
            }
        } catch (error) {
            console.error('Error al enviar acción:', error);
            alert('Error de conexión al intentar atender la solicitud.');
        }
    };

    const verDetallePedido = (idPedido) => {
        alert(`Ver detalle del pedido #${idPedido}. Implementar Modal/Redirección aquí.`);
    };
    
    const verMesa = (idMesa) => {
        alert(`Ver información de la mesa #${idMesa}. Implementar Modal/Redirección aquí.`);
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000); 
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // Manejo seguro para datos undefined
    const mesasOcupadas = useMemo(() => Array.isArray(data?.mesas) ? data.mesas.filter(m => m.estado === 'Ocupada').length : 0, [data.mesas]);
    const mesasDisponibles = useMemo(() => Array.isArray(data?.mesas) ? data.mesas.filter(m => m.estado === 'Disponible').length : 0, [data.mesas]);
    const totalPedidos = Array.isArray(data?.pedidos) ? data.pedidos.length : 0;
    const totalSolicitudes = Array.isArray(data?.solicitudes) ? data.solicitudes.length : 0;


    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }
    if (loading && (!Array.isArray(data?.mesas) || data.mesas.length === 0)) {
        return <div className="loading-state">Cargando vista del mesero...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <div className="header-left">
                    <div className="logo">
                        <FontAwesomeIcon icon={faUtensils} />
                        <span>ENTREMESA</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <div className="user-avatar">
                            <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Mesero</div>
                            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>ID: {data.id_mesero}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}

            <div className="stats-grid">
                <StatCard title="Solicitudes Pendientes" value={totalSolicitudes} icon={faBell} type="danger" />
                <StatCard title="Pedidos Activos" value={totalPedidos} icon={faClipboardList} type="warning" />
                <StatCard title="Mesas Ocupadas" value={mesasOcupadas} icon={faChair} type="success" />
                <StatCard title="Mesas Disponibles" value={mesasDisponibles} icon={faCheckCircle} type="info" />
            </div>

            <div className="content-grid">
                
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <FontAwesomeIcon icon={faExclamationCircle} />
                            Solicitudes de Atención
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px' }}>
                            {totalSolicitudes}
                        </span>
                    </div>
                    <div className="card-body">
                        {totalSolicitudes === 0 ? (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <p>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            data.solicitudes.map(solicitud => (
                                <div className="solicitud-item" key={solicitud.id_atencion}>
                                    <div className="solicitud-header">
                                        <div className="solicitud-tipo">
                                            <FontAwesomeIcon icon={solicitud.tipo_solicitud === 'Cuenta' ? faReceipt : faHandPaper} />
                                            {solicitud.tipo_solicitud}
                                        </div>
                                        <div className="solicitud-tiempo">
                                            {calcularTiempoEspera(solicitud.fecha_hora_solicitud)}
                                        </div>
                                    </div>
                                    <div className="solicitud-info">
                                        <span><FontAwesomeIcon icon={faUser} /> {solicitud.nombre_cliente}</span>
                                        <span><FontAwesomeIcon icon={faTable} /> Mesa {solicitud.numero_mesa}</span>
                                    </div>
                                    <button className="btn-accion" onClick={() => atenderSolicitud(solicitud.id_atencion)}>
                                        <FontAwesomeIcon icon={faCheck} /> Atender
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <FontAwesomeIcon icon={faShoppingCart} />
                            Pedidos Activos
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px' }}>
                            {totalPedidos}
                        </span>
                    </div>
                    <div className="card-body">
                        {totalPedidos === 0 ? (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faClipboardList} />
                                <p>No hay pedidos activos</p>
                            </div>
                        ) : (
                            data.pedidos.map(pedido => (
                                <div className="pedido-item" key={pedido.id_pedido}>
                                    <div className="pedido-header">
                                        <div className="pedido-numero">
                                            <FontAwesomeIcon icon={faHashtag} /> Pedido #{pedido.id_pedido}
                                        </div>
                                        <span className={`estado-badge estado-${pedido.estado.toLowerCase().replace(' ', '-')}`}>
                                            {pedido.estado}
                                        </span>
                                    </div>
                                    <div className="pedido-info">
                                        <div className="pedido-detail">
                                            <span className="pedido-detail-label">Cliente</span>
                                            <span className="pedido-detail-value">{pedido.nombre_cliente}</span>
                                        </div>
                                        <div className="pedido-detail">
                                            <span className="pedido-detail-label">Mesa</span>
                                            <span className="pedido-detail-value">{pedido.numero_mesa}</span>
                                        </div>
                                        <div className="pedido-detail">
                                            <span className="pedido-detail-label">Hora</span>
                                            <span className="pedido-detail-value">{new Date(pedido.fecha_hora_pedido).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div className="pedido-total">
                                        {formatCurrency(pedido.total)}
                                    </div>
                                    <button className="btn-pedido" onClick={() => verDetallePedido(pedido.id_pedido)}>
                                        <FontAwesomeIcon icon={faEye} /> Ver Detalle
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <FontAwesomeIcon icon={faTh} />
                        Estado de Mesas
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px' }}>
                        Total: {data.mesas.length}
                    </span>
                </div>
                <div className="card-body">
                    <div className="mesas-grid">
                        {data.mesas.map(mesa => (
                            <div 
                                className={`mesa-card ${mesa.estado.toLowerCase()}`} 
                                onClick={() => verMesa(mesa.id_mesa)}
                                key={mesa.id_mesa}
                            >
                                <div className="mesa-numero">{mesa.numero_mesa}</div>
                                <div className="mesa-capacidad">
                                    <FontAwesomeIcon icon={faUsers} /> {mesa.capacidad} personas
                                </div>
                                <span className={`mesa-estado ${mesa.estado.toLowerCase()}`}>
                                    {mesa.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                    {data.mesas.length === 0 && <p className="empty-state-small">No hay información de mesas.</p>}
                </div>
            </div>
        </div>
    );
};

export default MeseroView;
