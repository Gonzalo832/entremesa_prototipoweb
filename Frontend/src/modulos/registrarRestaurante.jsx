import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Notificacion from '../components/Notificacion';
import './styleRegistroRestaurante.css'; 

function RegistrarRestaurante() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurante: {
      nombre: '',
      ubicacion: '',
      num_mesas: 1 
    },
    gerente: {
      nombre: '',
      correo_electronico: '',
      password: ''
    }
  });

  const [menuItems, setMenuItems] = useState([
    { nombre: '', precio: '', categoria: '' }
  ]);

  const handleMenuChange = (index, field, value) => {
    setMenuItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addMenuItem = () => {
    setMenuItems(prev => ([...prev, { nombre: '', precio: '', categoria: '' }]));
  };

  const removeMenuItem = (index) => {
    if (menuItems.length > 1) { 
        setMenuItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? 1 : parseInt(value) || 1) : value;

    if (name.startsWith('restaurante.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        restaurante: {
          ...prev.restaurante,
          [field]: finalValue
        }
      }));
    } else if (name.startsWith('gerente.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        gerente: {
          ...prev.gerente,
          [field]: finalValue
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validMenuItems = menuItems.filter(item => 
      item.nombre.trim() !== '' && item.precio.trim() !== '' && item.categoria.trim() !== ''
    );

    if (validMenuItems.length === 0) {
        setError("Debe agregar al menos un platillo completo al menú.");
        setLoading(false);
        return;
    }
    
    // Validación de número de mesas
    if (formData.restaurante.num_mesas < 1) {
        setError("El número de mesas debe ser al menos 1.");
        setLoading(false);
        return;
    }

    try {
      //Codigo para hacer la Petición al Backend
      const requestBody = {
          nombre: formData.restaurante.nombre,
          ubicacion: formData.restaurante.ubicacion,
          num_mesas: formData.restaurante.num_mesas, 
          gerente: {
              nombre: formData.gerente.nombre,
              correo_electronico: formData.gerente.correo_electronico,
              password: formData.gerente.password
          },
          menu: validMenuItems 
      };

      const response = await fetch('http://entremesa-backend.test/api/restaurantes', {
        method: 'POST',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el restaurante');
      }

      const data = await response.json();
      console.log('Restaurante registrado:', data);
      
      // Mostrar notificación y redireccionar al inicio después de 3 segundos
      setShowNotification(true);
      setTimeout(() => {
        navigate('/');
      }, 3000); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="registrar-restaurante-container">
      {showNotification && (
        <Notificacion 
          mensaje={`¡Restaurante ${formData.restaurante.nombre} registrado exitosamente!`} 
          tipo="success" 
        />
      )}
      <h2>Registro de Restaurante</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="registrar-restaurante-form">
        
        <h3>Información del Restaurante</h3>
        <label>Nombre del Restaurante:</label>
        <input
          type="text" 
          name="restaurante.nombre" 
          value={formData.restaurante.nombre}
          onChange={handleChange}
          required
        />
        
        <label>Ubicación del Restaurante:</label>
        <input 
          type="text" 
          name="restaurante.ubicacion" 
          value={formData.restaurante.ubicacion} 
          onChange={handleChange} 
          required
        />

        <label>Número de Mesas Totales (Mínimo 1):</label>
        <input 
          type="number" 
          name="restaurante.num_mesas" 
          value={formData.restaurante.num_mesas} 
          onChange={handleChange} 
          required 
          min="1" 
          max="100" 
        />

        <h3>Información del Gerente</h3>
        <label>Nombre Completo:</label>
        <input 
          type="text" 
          name="gerente.nombre" 
          value={formData.gerente.nombre} 
          onChange={handleChange} 
          required
        />

        <label>Correo Electrónico:</label>
        <input 
          type="email" 
          name="gerente.correo_electronico" 
          value={formData.gerente.correo_electronico} 
          onChange={handleChange} 
          required 
        />

        <label>Contraseña:</label>
        <input 
          type="password" 
          name="gerente.password" 
          value={formData.gerente.password} 
          onChange={handleChange} 
          required 
          minLength={6}
        />

        {/* 6. Sección Dinámica del Menú */}
        <h3>Registro de Menú 🍽️</h3>
        
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item-form">
            <h4>Platillo #{index + 1}</h4>
            <label>Nombre del Platillo:</label>
            <input 
              type="text" 
              value={item.nombre} 
              onChange={(e) => handleMenuChange(index, 'nombre', e.target.value)} 
              required
            />
            
            <label>Precio:</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              value={item.precio} 
              onChange={(e) => handleMenuChange(index, 'precio', e.target.value)} 
              required
            />
            
            <label>Categoría:</label>
            <input 
              type="text" 
              value={item.categoria} 
              onChange={(e) => handleMenuChange(index, 'categoria', e.target.value)} 
              required
            />
            
            {menuItems.length > 1 && (
                <button type="button" onClick={() => removeMenuItem(index)} className="remove-item-btn">
                    Eliminar Platillo
                </button>
            )}
            <hr />
          </div>
        ))}
        
        <button type="button" onClick={addMenuItem} className="add-item-btn">
          ➕ Agregar otro platillo
        </button>
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Registrando...' : 'Registrar Restaurante'}
        </button>
      </form>
    </div>
  );
}

export default RegistrarRestaurante;