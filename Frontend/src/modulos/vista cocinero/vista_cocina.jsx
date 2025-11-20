import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './vista_cocina.css';
import { faUtensils, faClock, faFire, faClipboardList, faTags, faLayerGroup, faList, faCheckCircle, faHashtag, faTable, faUser, faTag, faCommentAlt, faPlay, faCheck, faChartBar } from '@fortawesome/free-solid-svg-icons';


const calcularTiempoEspera = (fechaHoraPedido) => {
  const tiempo = new Date().getTime() - new Date(fechaHoraPedido).getTime();
  return Math.floor(tiempo / 60000); 
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN', 
    minimumFractionDigits: 2,
  }).format(amount).replace('MX$', '$'); 
};

// Agrupa los detalles de un pedido por categoría
const agruparDetalles = (detalles) => {
    return detalles.reduce((acc, detalle) => {
        const { categoria } = detalle;
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(detalle);
        return acc;
    }, {});
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

// Componente para el Ítem de Pedido Individual
const PedidoCocinaItem = ({ pedido, onAction }) => {
    const estadoClass = pedido.estado.toLowerCase().replace(' ', '-');
    const detallesPorCategoria = useMemo(() => agruparDetalles(pedido.detalles), [pedido.detalles]);
    const tiempoEspera = calcularTiempoEspera(pedido.fecha_hora_pedido);

    return (
        <div className="pedido-cocina-item" data-estado={estadoClass}>
            <div className="pedido-cocina-header">
                <div className="pedido-cocina-info">
                    <div className="pedido-numero">
                        <FontAwesomeIcon icon={faHashtag} /> Pedido #{pedido.id_pedido}
                    </div>
                    <div className="pedido-mesa-cliente">
                        <span><FontAwesomeIcon icon={faTable} /> Mesa {pedido.numero_mesa}</span>
                        <span><FontAwesomeIcon icon={faUser} /> {pedido.nombre_cliente}</span>
                    </div>
                </div>
                <div className="pedido-cocina-acciones">
                    <span className={`estado-badge estado-${estadoClass}`}>
                        {pedido.estado}
                    </span>
                    <div className="tiempo-espera">
                        {tiempoEspera} min
                    </div>
                </div>
            </div>

            <div className="pedido-detalles">
                {Object.entries(detallesPorCategoria).map(([categoria, detalles]) => (
                    <div className="categoria-detalle" key={categoria}>
                        <div className="categoria-detalle-header">
                            <FontAwesomeIcon icon={faTag} /> {categoria}
                        </div>
                        {detalles.map((detalle) => (
                            <div className="platillo-item" key={detalle.id_detalle_pedido}>
                                <div className="platillo-info">
                                    <div className="platillo-nombre-cantidad">
                                        <span className="platillo-cantidad">{detalle.cantidad}x</span>
                                        <span className="platillo-nombre">{detalle.nombre_platillo}</span>
                                    </div>
                                    {detalle.comentarios && (
                                        <div className="platillo-comentarios">
                                            <FontAwesomeIcon icon={faCommentAlt} /> {detalle.comentarios}
                                        </div>
                                    )}
                                </div>
                                <div className="platillo-precio">
                                    {formatCurrency(detalle.subtotal)}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="pedido-total-cocina">
                <span>Total: {formatCurrency(pedido.total)}</span>
            </div>

            <div className="pedido-botones">
                {pedido.estado === 'Pendiente' && (
                    <button 
                        className="btn-cocina btn-iniciar" 
                        onClick={() => onAction(pedido.id_pedido, 'iniciar', 'iniciar la preparación')}
                    >
                        <FontAwesomeIcon icon={faPlay} /> Iniciar Preparación
                    </button>
                )}
                {pedido.estado === 'En preparación' && (
                    <button 
                        className="btn-cocina btn-completar" 
                        onClick={() => onAction(pedido.id_pedido, 'completar', 'marcar como listo')}
                    >
                        <FontAwesomeIcon icon={faCheck} /> Marcar como Listo
                    </button>
                )}
            </div>
        </div>
    );
};


const CocinaView = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const API_URL = `http://entremesa-backend.test/api/cocinero/${id}`;
    const [data, setData] = useState({ pedidos: [], categorias: [], platillos: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Validación de usuario igual que en RestauranteDashboard
    if (!user || user.id !== parseInt(id) || user.tipo !== 'cocina') {
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
            setError('Error al conectar con el backend. Mostrando datos vacíos o de ejemplo si los hay.');
            setData({ pedidos: [], categorias: [], platillos: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePedidoAction = async (idPedido, accion, mensajeAccion) => {
        if (!window.confirm(`¿Desea ${mensajeAccion} el pedido #${idPedido}?`)) {
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_pedido: idPedido, accion: accion }),
            });

            const result = await response.json();

            if (result.success) {
                fetchData();
            } else {
                alert(`Error: ${result.message || 'No se pudo actualizar el pedido'}`);
            }
        } catch (error) {
            console.error('Error al enviar acción:', error);
            alert('Error de conexión al intentar actualizar el pedido.');
        }
    };

    // Efecto para cargar datos al inicio y para el auto-refresh
    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000); 
        return () => clearInterval(intervalId); 
    }, [fetchData]);

    const pedidosPendientes = Array.isArray(data?.pedidos) ? data.pedidos.filter(p => p.estado === 'Pendiente').length : 0;
    const pedidosEnPreparacion = Array.isArray(data?.pedidos) ? data.pedidos.filter(p => p.estado === 'En preparación').length : 0;
    const totalPedidos = Array.isArray(data?.pedidos) ? data.pedidos.length : 0;
    const totalCategorias = Array.isArray(data?.categorias) ? data.categorias.length : 0;


    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }
    if (loading && totalPedidos === 0) {
        return <div className="loading-state">Cargando pedidos...</div>;
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
                            <FontAwesomeIcon icon={faUtensils} /> 
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Cocina</div>
                            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>Vista de Preparación</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard title="Pedidos Pendientes" value={pedidosPendientes} icon={faClock} type="danger" />
                <StatCard title="En Preparación" value={pedidosEnPreparacion} icon={faFire} type="warning" />
                <StatCard title="Total Pedidos" value={totalPedidos} icon={faClipboardList} type="info" />
                <StatCard title="Categorías Activas" value={totalCategorias} icon={faTags} type="success" />
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <FontAwesomeIcon icon={faLayerGroup} />
                        Resumen por Categoría
                    </div>
                </div>
                <div className="card-body">
                    <div className="categorias-grid">
                        {Array.isArray(data.categorias) && data.categorias.length > 0 ? (
                            data.categorias.map((categoria, index) => (
                                <div className="categoria-item" key={index}>
                                    <div className="categoria-nombre">{categoria.categoria}</div>
                                    <div className="categoria-stats">
                                        <span><FontAwesomeIcon icon={faClipboardList} /> {categoria.total_pedidos} pedidos</span>
                                        <span><FontAwesomeIcon icon={faUtensils} /> {categoria.total_cantidad} platillos</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state-small">No hay categorías activas.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="content-grid">
                <div className="card card-full">
                    <div className="card-header">
                        <div className="card-title">
                            <FontAwesomeIcon icon={faList} />
                            Pedidos en Cocina
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px' }}>
                            {totalPedidos}
                        </span>
                    </div>
                    <div className="card-body">
                        {error && <div className="error-message">{error}</div>}
                        {totalPedidos === 0 || !Array.isArray(data.pedidos) ? (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <p>No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            data.pedidos.map(pedido => (
                                <PedidoCocinaItem 
                                    key={pedido.id_pedido} 
                                    pedido={pedido} 
                                    onAction={handlePedidoAction} 
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <FontAwesomeIcon icon={faChartBar} />
                        Platillos en Preparación
                    </div>
                </div>
                <div className="card-body">
                    {!Array.isArray(data.platillos) || data.platillos.length === 0 ? (
                        <div className="empty-state">
                            <FontAwesomeIcon icon={faUtensils} />
                            <p>No hay platillos pendientes</p>
                        </div>
                    ) : (
                        <div className="platillos-lista">
                            {data.platillos.map((platillo, index) => (
                                <div className="platillo-resumen" key={index}>
                                    <div className="platillo-resumen-info">
                                        <div className="platillo-resumen-nombre">{platillo.nombre_platillo}</div>
                                        <div className="platillo-resumen-categoria">{platillo.categoria}</div>
                                    </div>
                                    <div className="platillo-resumen-cantidades">
                                        <span className="cantidad-badge">
                                            <FontAwesomeIcon icon={faHashtag} /> {platillo.cantidad_total} unidades
                                        </span>
                                        <span className="pedidos-badge">
                                            <FontAwesomeIcon icon={faClipboardList} /> {platillo.num_pedidos} pedidos
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CocinaView;
