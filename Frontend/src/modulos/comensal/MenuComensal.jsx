import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, faMinus, faTrash, faUser, faReceipt, faCreditCard, faMoneyBill
} from '@fortawesome/free-solid-svg-icons';
import './MenuComensal.css';

function MenuComensal() {
    const { codigo_qr } = useParams();
    const [menu, setMenu] = useState([]);
    const [pedido, setPedido] = useState([]);
    const [mesa, setMesa] = useState(null);
    const [restaurante, setRestaurante] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mostrarPago, setMostrarPago] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [codigo_qr]);

    const cargarDatos = async () => {
        try {
            const response = await fetch(`http://172.20.10.2:8000/api/menu-comensal/${codigo_qr}`);
            if (response.ok) {
                const data = await response.json();
                setMesa(data.mesa);
                setRestaurante(data.restaurante);
                setMenu(data.menu);
            } else {
                alert('Código QR no válido');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar el menú');
        } finally {
            setLoading(false);
        }
    };

    const agregarAlPedido = (platillo) => {
        const existente = pedido.find(p => p.id_menu === platillo.id_menu);
        if (existente) {
            setPedido(pedido.map(p => 
                p.id_menu === platillo.id_menu 
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            setPedido([...pedido, { ...platillo, cantidad: 1 }]);
        }
    };

    const modificarCantidad = (idMenu, cambio) => {
        setPedido(pedido.map(p => {
            if (p.id_menu === idMenu) {
                const nuevaCantidad = p.cantidad + cambio;
                return nuevaCantidad > 0 ? { ...p, cantidad: nuevaCantidad } : p;
            }
            return p;
        }).filter(p => p.cantidad > 0));
    };

    const eliminarDelPedido = (idMenu) => {
        setPedido(pedido.filter(p => p.id_menu !== idMenu));
    };

    const calcularTotal = () => {
        return pedido.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toFixed(2);
    };

    const enviarPedido = async () => {
        if (pedido.length === 0) {
            alert('Agrega platillos a tu pedido');
            return;
        }

        try {
            const response = await fetch('http://172.20.10.2:8000/api/pedido-comensal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo_qr: codigo_qr,
                    pedido: pedido,
                    total: calcularTotal()
                })
            });

            if (response.ok) {
                alert('¡Pedido enviado! El cocinero lo está preparando.');
                setPedido([]);
            } else {
                alert('Error al enviar el pedido');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar el pedido');
        }
    };

    const solicitarMesero = async () => {
        try {
            const response = await fetch('http://172.20.10.2:8000/api/solicitar-mesero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_qr: codigo_qr })
            });

            if (response.ok) {
                alert('✅ Mesero notificado, llegará pronto');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const solicitarCuenta = async (metodoPago) => {
        try {
            const response = await fetch('http://172.20.10.2:8000/api/solicitar-cuenta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    codigo_qr: codigo_qr,
                    metodo_pago: metodoPago,
                    total: calcularTotal()
                })
            });

            if (response.ok) {
                alert(`✅ Mesero notificado para pago con ${metodoPago}`);
                setMostrarPago(false);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const menuPorCategoria = menu.reduce((acc, platillo) => {
        const cat = platillo.categoria || 'Sin categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(platillo);
        return acc;
    }, {});

    if (loading) {
        return <div className="loading">Cargando menú...</div>;
    }

    return (
        <div className="menu-comensal">
            <header className="comensal-header">
                <h1>{restaurante?.nombre || 'Restaurante'}</h1>
                <p className="mesa-info">Mesa {mesa?.numero_mesa}</p>
            </header>

            <div className="menu-container">
                <div className="menu-content">
                    <h2>Menú</h2>
                    {Object.entries(menuPorCategoria).map(([categoria, platillos]) => (
                        <div key={categoria} className="categoria-section">
                            <h3 className="categoria-titulo">{categoria}</h3>
                            <div className="platillos-lista">
                                {platillos.map(platillo => (
                                    <div key={platillo.id_menu} className="platillo-card">
                                        <div className="platillo-info">
                                            <h4>{platillo.nombre}</h4>
                                            {platillo.descripcion && (
                                                <p className="descripcion">{platillo.descripcion}</p>
                                            )}
                                            <p className="precio">${platillo.precio}</p>
                                        </div>
                                        <button 
                                            className="btn-agregar"
                                            onClick={() => agregarAlPedido(platillo)}
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pedido-sidebar">
                    <h2>Tu Pedido</h2>
                    {pedido.length === 0 ? (
                        <p className="pedido-vacio">No has agregado platillos</p>
                    ) : (
                        <>
                            <div className="pedido-items">
                                {pedido.map(item => (
                                    <div key={item.id_menu} className="pedido-item">
                                        <div className="item-info">
                                            <h4>{item.nombre}</h4>
                                            <p>${item.precio} c/u</p>
                                        </div>
                                        <div className="item-controls">
                                            <button onClick={() => modificarCantidad(item.id_menu, -1)}>
                                                <FontAwesomeIcon icon={faMinus} />
                                            </button>
                                            <span>{item.cantidad}</span>
                                            <button onClick={() => modificarCantidad(item.id_menu, 1)}>
                                                <FontAwesomeIcon icon={faPlus} />
                                            </button>
                                            <button 
                                                className="btn-eliminar"
                                                onClick={() => eliminarDelPedido(item.id_menu)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                        <p className="subtotal">${(item.precio * item.cantidad).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="pedido-total">
                                <h3>Total: ${calcularTotal()}</h3>
                            </div>
                            <button className="btn-enviar-pedido" onClick={enviarPedido}>
                                Enviar Pedido a Cocina
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="acciones-footer">
                <button className="btn-accion" onClick={solicitarMesero}>
                    <FontAwesomeIcon icon={faUser} /> Solicitar Mesero
                </button>
                <button className="btn-accion" onClick={() => setMostrarPago(true)}>
                    <FontAwesomeIcon icon={faReceipt} /> Solicitar Cuenta
                </button>
            </div>

            {mostrarPago && (
                <div className="modal-overlay" onClick={() => setMostrarPago(false)}>
                    <div className="modal-pago" onClick={(e) => e.stopPropagation()}>
                        <h2>Método de Pago</h2>
                        <p>Total a pagar: ${calcularTotal()}</p>
                        <div className="opciones-pago">
                            <button onClick={() => solicitarCuenta('Terminal')}>
                                <FontAwesomeIcon icon={faCreditCard} />
                                <span>Terminal (Tarjeta)</span>
                            </button>
                            <button onClick={() => solicitarCuenta('Efectivo')}>
                                <FontAwesomeIcon icon={faMoneyBill} />
                                <span>Efectivo</span>
                            </button>
                        </div>
                        <button className="btn-cancelar" onClick={() => setMostrarPago(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MenuComensal;
