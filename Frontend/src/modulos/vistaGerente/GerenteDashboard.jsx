import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, faTimes, faHome, faQrcode, faUtensils, faUsers, 
    faUser, faSignOutAlt, faChartLine, faTable, faPlus, faEdit, faTrash
} from '@fortawesome/free-solid-svg-icons';
import './GerenteDashboard.css';
import MeseroForm from './MeseroForm.jsx';
import CocineroForm from './CocineroForm.jsx';

function GerenteDashboard() {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('inicio');
    const [showMeseroForm, setShowMeseroForm] = useState(false);
    const [showCocineroForm, setShowCocineroForm] = useState(false);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingPlatillo, setEditingPlatillo] = useState(null);
    const [menuFormData, setMenuFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: ''
    });
    
    // Estados para datos del dashboard
    const [stats, setStats] = useState({
        totalVentas: 0,
        mesasDisponibles: 0,
        mesasOcupadas: 0,
        pedidosHoy: 0
    });
    const [mesas, setMesas] = useState([]);
    const [menu, setMenu] = useState([]);
    const [empleados, setEmpleados] = useState({ meseros: [], cocineros: [] });
    const [qrCodes, setQrCodes] = useState([]);

    if (!user || user.restaurante.id !== parseInt(id)) {
        return <div>No autorizado</div>;
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Obtener estadísticas
            const statsResponse = await fetch(`http://172.20.10.2:8000/api/restaurante/${user.restaurante.id}/stats`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.data);
            }

            // Obtener mesas
            const mesasResponse = await fetch(`http://172.20.10.2:8000/api/restaurante/${user.restaurante.id}/mesas`);
            if (mesasResponse.ok) {
                const mesasData = await mesasResponse.json();
                setMesas(mesasData.data);
            }

            // Obtener menú
            const menuResponse = await fetch(`http://172.20.10.2:8000/api/restaurante/${user.restaurante.id}/menu`);
            if (menuResponse.ok) {
                const menuData = await menuResponse.json();
                setMenu(menuData.data);
            }

            // Obtener empleados
            const empleadosResponse = await fetch(`http://172.20.10.2:8000/api/restaurante/${user.restaurante.id}/empleados`);
            if (empleadosResponse.ok) {
                const empleadosData = await empleadosResponse.json();
                setEmpleados(empleadosData.data);
            }

            // Obtener códigos QR
            const qrResponse = await fetch(`http://172.20.10.2:8000/api/restaurante/${user.restaurante.id}/qr-codes`);
            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                setQrCodes(qrData.data);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDeleteEmpleado = async (tipo, id) => {
        if (!window.confirm(`¿Está seguro de eliminar este ${tipo}?`)) return;
        
        try {
            const response = await fetch(`http://172.20.10.2:8000/api/${tipo}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchDashboardData();
                alert(`${tipo} eliminado correctamente`);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleDeleteMenu = async (idMenu) => {
        if (!window.confirm('¿Está seguro de eliminar este platillo?')) return;
        
        try {
            const response = await fetch(`http://172.20.10.2:8000/api/menu/${idMenu}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchDashboardData();
                alert('Platillo eliminado correctamente');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleOpenMenuForm = (platillo = null) => {
        if (platillo) {
            setEditingPlatillo(platillo);
            setMenuFormData({
                nombre: platillo.nombre,
                descripcion: platillo.descripcion || '',
                precio: platillo.precio,
                categoria: platillo.categoria
            });
        } else {
            setEditingPlatillo(null);
            setMenuFormData({
                nombre: '',
                descripcion: '',
                precio: '',
                categoria: ''
            });
        }
        setShowMenuForm(true);
    };

    const handleCloseMenuForm = () => {
        setShowMenuForm(false);
        setEditingPlatillo(null);
        setMenuFormData({
            nombre: '',
            descripcion: '',
            precio: '',
            categoria: ''
        });
    };

    const handleMenuFormChange = (e) => {
        const { name, value } = e.target;
        setMenuFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitMenu = async (e) => {
        e.preventDefault();
        
        const url = editingPlatillo 
            ? `http://172.20.10.2:8000/api/menu/${editingPlatillo.id_menu}`
            : `http://172.20.10.2:8000/api/menu`;
        
        const method = editingPlatillo ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...menuFormData,
                    id_restaurante: user.restaurante.id
                })
            });

            if (response.ok) {
                alert(editingPlatillo ? 'Platillo actualizado correctamente' : 'Platillo agregado correctamente');
                handleCloseMenuForm();
                fetchDashboardData();
            } else {
                const errorData = await response.json();
                alert('Error: ' + (errorData.message || 'No se pudo guardar el platillo'));
            }
        } catch (error) {
            console.error('Error al guardar platillo:', error);
            alert('Error al guardar el platillo');
        }
    };

    const downloadQR = async (qrUrl, numeroMesa) => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR_Mesa_${numeroMesa}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar QR:', error);
            alert('Error al descargar el código QR');
        }
    };

    return (
        <div className="gerente-dashboard">
            {/* Navbar lateral */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Entremesa</h2>
                    <button className="close-btn" onClick={() => setSidebarOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <button onClick={() => { setActiveSection('inicio'); setSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faHome} /> Inicio
                    </button>
                    <button onClick={() => { setActiveSection('qr'); setSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faQrcode} /> Códigos QR
                    </button>
                    <button onClick={() => { setActiveSection('menu'); setSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faUtensils} /> Menú
                    </button>
                    <button onClick={() => { setActiveSection('empleados'); setSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faUsers} /> Empleados
                    </button>
                    <button onClick={() => { setActiveSection('cuenta'); setSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faUser} /> Mi Cuenta
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                    </button>
                </nav>
            </div>

            {/* Contenido principal */}
            <div className="main-content">
                <div className="topbar">
                    <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    <h1>{user.restaurante.nombre}</h1>
                    <div className="user-info-top">
                        <span>{user.nombre}</span>
                    </div>
                </div>

                <div className="content-area">
                    {/* Sección Inicio */}
                    {activeSection === 'inicio' && (
                        <div className="inicio-section">
                            <h2>Estadísticas de Ventas</h2>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <FontAwesomeIcon icon={faChartLine} className="stat-icon" />
                                    <div className="stat-info">
                                        <h3>Ventas Totales</h3>
                                        <p className="stat-value">${stats.totalVentas}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <FontAwesomeIcon icon={faTable} className="stat-icon" />
                                    <div className="stat-info">
                                        <h3>Mesas Disponibles</h3>
                                        <p className="stat-value">{stats.mesasDisponibles}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <FontAwesomeIcon icon={faTable} className="stat-icon occupied" />
                                    <div className="stat-info">
                                        <h3>Mesas Ocupadas</h3>
                                        <p className="stat-value">{stats.mesasOcupadas}</p>
                                    </div>
                                </div>
                            </div>

                            <h2>Estado de Mesas</h2>
                            <div className="mesas-grid">
                                {mesas.map(mesa => (
                                    <div key={mesa.id_mesa} className={`mesa-card ${mesa.estado.toLowerCase()}`}>
                                        <h3>Mesa {mesa.numero_mesa}</h3>
                                        <p>Capacidad: {mesa.capacidad} personas</p>
                                        <span className="mesa-estado">{mesa.estado}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sección Códigos QR */}
                    {activeSection === 'qr' && (
                        <div className="qr-section">
                            <h2>Códigos QR de Mesas</h2>
                            <div className="qr-grid">
                                {qrCodes.map(qr => (
                                    <div key={qr.id_mesa} className="qr-card">
                                        <h3>Mesa {qr.numero_mesa}</h3>
                                        <img src={qr.qr_url} alt={`QR Mesa ${qr.numero_mesa}`} />
                                        <button onClick={() => downloadQR(qr.qr_url, qr.numero_mesa)}>
                                            Descargar QR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sección Menú */}
                    {activeSection === 'menu' && (
                        <div className="menu-section">
                            <div className="section-header">
                                <h2>Menú del Restaurante</h2>
                                <button className="btn-add" onClick={() => handleOpenMenuForm()}>
                                    <FontAwesomeIcon icon={faPlus} /> Agregar Platillo
                                </button>
                            </div>
                            <div className="menu-list">
                                {menu.map(platillo => (
                                    <div key={platillo.id_menu} className="menu-item">
                                        <div className="menu-info">
                                            <h3>{platillo.nombre}</h3>
                                            <p>{platillo.descripcion}</p>
                                            <span className="categoria">{platillo.categoria}</span>
                                            <span className="precio">${platillo.precio}</span>
                                        </div>
                                        <div className="menu-actions">
                                            <button className="btn-edit" onClick={() => handleOpenMenuForm(platillo)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDeleteMenu(platillo.id_menu)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sección Empleados */}
                    {activeSection === 'empleados' && (
                        <div className="empleados-section">
                            <h2>Gestión de Empleados</h2>
                            
                            <div className="empleados-group">
                                <div className="section-header">
                                    <h3>Meseros</h3>
                                    <button className="btn-add" onClick={() => setShowMeseroForm(true)}>
                                        <FontAwesomeIcon icon={faPlus} /> Agregar Mesero
                                    </button>
                                </div>
                                <div className="empleados-list">
                                    {empleados.meseros.map(mesero => (
                                        <div key={mesero.id_mesero} className="empleado-card">
                                            <div className="empleado-info">
                                                <h4>{mesero.nombre}</h4>
                                                <p>{mesero.correo_electronico}</p>
                                            </div>
                                            <button className="btn-delete" onClick={() => handleDeleteEmpleado('mesero', mesero.id_mesero)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="empleados-group">
                                <div className="section-header">
                                    <h3>Cocineros</h3>
                                    <button className="btn-add" onClick={() => setShowCocineroForm(true)}>
                                        <FontAwesomeIcon icon={faPlus} /> Agregar Cocinero
                                    </button>
                                </div>
                                <div className="empleados-list">
                                    {empleados.cocineros.map(cocinero => (
                                        <div key={cocinero.id_cocinero} className="empleado-card">
                                            <div className="empleado-info">
                                                <h4>{cocinero.nombre}</h4>
                                                <p>{cocinero.correo_electronico}</p>
                                            </div>
                                            <button className="btn-delete" onClick={() => handleDeleteEmpleado('cocinero', cocinero.id_cocinero)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sección Mi Cuenta */}
                    {activeSection === 'cuenta' && (
                        <div className="cuenta-section">
                            <h2>Mi Cuenta</h2>
                            <div className="cuenta-info">
                                <div className="info-group">
                                    <label>Nombre del Restaurante</label>
                                    <p>{user.restaurante.nombre}</p>
                                </div>
                                <div className="info-group">
                                    <label>Correo Electrónico</label>
                                    <p>{user.correo}</p>
                                </div>
                                <div className="info-group">
                                    <label>Ubicación</label>
                                    <p>{user.restaurante.ubicacion}</p>
                                </div>
                                <button className="btn-change-password">Cambiar Contraseña</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {showMeseroForm && (
                <MeseroForm 
                    restauranteId={user.restaurante.id} 
                    onClose={() => { setShowMeseroForm(false); fetchDashboardData(); }} 
                />
            )}
            {showCocineroForm && (
                <CocineroForm 
                    restauranteId={user.restaurante.id} 
                    onClose={() => { setShowCocineroForm(false); fetchDashboardData(); }} 
                />
            )}
            {showMenuForm && (
                <div className="modal-overlay" onClick={handleCloseMenuForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingPlatillo ? 'Editar Platillo' : 'Agregar Platillo'}</h2>
                        <form onSubmit={handleSubmitMenu}>
                            <div className="form-group">
                                <label>Nombre del Platillo *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={menuFormData.nombre}
                                    onChange={handleMenuFormChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={menuFormData.descripcion}
                                    onChange={handleMenuFormChange}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Precio *</label>
                                <input
                                    type="number"
                                    name="precio"
                                    value={menuFormData.precio}
                                    onChange={handleMenuFormChange}
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Categoría *</label>
                                <input
                                    type="text"
                                    name="categoria"
                                    value={menuFormData.categoria}
                                    onChange={handleMenuFormChange}
                                    placeholder="Ej: Entradas, Plato Fuerte, Postres, Bebidas"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={handleCloseMenuForm} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingPlatillo ? 'Actualizar' : 'Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GerenteDashboard;
