import React, { useState, useEffect } from 'react';
import './restaurantview.css';

// DATOS PARA PRUEBA
const mockMenu = [
  { id: 1, nombre: 'Tacos ', precio: 35.50, categoria: 'Platos Fuertes' },
  { id: 2, nombre: 'Sopa ', precio: 50.00, categoria: 'Entradas' },
  { id: 3, nombre: 'Agua de Horchata', precio: 25.00, categoria: 'Bebidas' },
  { id: 4, nombre: 'Flan ', precio: 45.00, categoria: 'Postres' },
  { id: 5, nombre: 'Enchiladas', precio: 95.00, categoria: 'Platos Fuertes' },
];

const mockRestaurant = {
  nombre: "El Buen Sazón",
  mesa: "Mesa 5",
};

function RestaurantView() {
  
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Pendiente');
  const [viewMode, setViewMode] = useState('menu'); 
  
  useEffect(() => {
    document.body.classList.add('restaurant-bg');

    return () => {
      document.body.classList.remove('restaurant-bg');
    };
  }, []); 

  

  // CODIGO DEL CARRITO Y PEDIDOS
  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, cantidad: 1 }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      alert("Añade algo al carrito antes de pedir.");
      return;
    }
    
    console.log("Pedido enviado a la API:", cart);

    setOrderStatus('En Proceso');
    setCart([]);
    alert("¡Pedido enviado con éxito! Puedes ver el estatus en Consumo.");
    setViewMode('consumo');
  };

  const requestWaiter = () => {
    console.log("Llamada al mesero enviada");
    alert("Mesero solicitado. Estará en su mesa pronto.");
  };
  
  // CODIGO PARA FORMA DE PAGO
  const handlePayment = (method) => {
    console.log(`Solicitud de pago con: ${method}`);
    alert(`Mesero solicitado para procesar el pago con ${method}. Gracias por su visita.`);
  };

  // CODIGO DE SECCIONES O LAS CATEGORIAS
  const renderMenu = () => (
    <div className="menu-list">
      <div className="menu-category-title">Platos Fuertes</div>
      {mockMenu.filter(item => item.categoria === 'Platos Fuertes').map(item => (
        <MenuItem key={item.id} item={item} onAdd={addToCart} />
      ))}
      
      <div className="menu-category-title">Entradas y Bebidas</div>
      {mockMenu.filter(item => item.categoria !== 'Platos Fuertes').map(item => (
        <MenuItem key={item.id} item={item} onAdd={addToCart} />
      ))}
    </div>
  );

  const renderConsumo = () => (
    <div className="consumo-panel">
      <div className="status-box">
        <h3>Estatus del Pedido:</h3>
        <p className={`status-label status-${orderStatus.replace(' ', '-').toLowerCase()}`}>
          {orderStatus}
        </p>
      </div>

      <div className="cart-summary">
        <h4>Resumen de Consumo:</h4>
        {cart.map(item => (
          <p key={item.id}>{item.nombre} x{item.cantidad} - ${ (item.precio * item.cantidad).toFixed(2) }</p>
        ))}
        {orderStatus === 'Pendiente' && cart.length > 0 && <p>Tienes {cart.length} artículos en el carrito listos para ordenar.</p>}
        {orderStatus === 'Pendiente' && cart.length === 0 && <p>Tu carrito está vacío.</p>}
        
        <div className="consumo-total">
          Total Pendiente: ${ calculateTotal().toFixed(2) }
        </div>
      </div>
      
      <div className="payment-options">
        <h4>Seleccionar Método de Pago:</h4>
        <button className="payment-btn primary" onClick={() => handlePayment('Terminal')}>
          Terminal (Tarjeta)
        </button>
        <button className="payment-btn secondary" onClick={() => handlePayment('Efectivo')}>
          Efectivo
        </button>
      </div>
    </div>
  );

  return (
    <div className="restaurant-view-container">
      <div className="restaurant-header">
        <h1>{mockRestaurant.nombre}</h1>
        <p className="table-info">{mockRestaurant.mesa}</p>
      </div>

      <div className="view-selector">
        <button 
          className={`selector-btn ${viewMode === 'menu' ? 'active' : ''}`}
          onClick={() => setViewMode('menu')}
        >
          Menú
        </button>
        <button 
          className={`selector-btn ${viewMode === 'consumo' ? 'active' : ''}`}
          onClick={() => setViewMode('consumo')}
        >
          Mi Consumo
        </button>
      </div>

      <div className="main-content-panel">
        {viewMode === 'menu' ? renderMenu() : renderConsumo()}
      </div>

      <div className="bottom-actions">
        {viewMode === 'menu' && (
          <button 
            className="order-btn"
            onClick={placeOrder}
            disabled={cart.length === 0}
          >
            PEDIR AHORA (${ calculateTotal().toFixed(2) })
          </button>
        )}
        
        <button 
          className="waiter-btn"
          onClick={requestWaiter}
        >
          Llamar Mesero
        </button>
      </div>
    </div>
  );
}

// COMPONENTES DEL MENU
const MenuItem = ({ item, onAdd }) => (
  <div className="menu-item">
    <div className="item-info">
      <p className="item-name">{item.nombre}</p>
      <p className="item-price">${item.precio.toFixed(2)}</p>
    </div>
    <button className="add-to-cart-btn" onClick={() => onAdd(item)}>
      Añadir
    </button>
  </div>
);

export default RestaurantView;