import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../formularios/login.css';

function Login() {
    const [formData, setFormData] = useState({
        correo_electronico: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://entremesa-backend.test/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    correo_electronico: formData.correo_electronico,
                    password: formData.password
                }),
            });

            let data;
            try {
                data = await response.json();
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setError('Error en la respuesta del servidor');
                return;
            }

            if (response.ok) {
                localStorage.setItem('token', data.token);
                // codigo para guardar los datos del usuario en el contexto
                authLogin(data.user);
                
                // Redirigir según el tipo de usuario
                switch (data.user.tipo) {
                    case 'gerente':
                        navigate(`/restaurante/${data.user.restaurante.id}/dashboard`);
                        break;
                    case 'mesero':
                        navigate(`/mesero/${data.user.id}/dashboard`);
                        break;
                    case 'cocina':
                        navigate(`/cocinero/${data.user.id}/dashboard`);
                        break;
                    case 'admin':
                        navigate('/admin/dashboard');
                        break;
                    default:
                        setError('Tipo de usuario no válido');
                }
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err) {
            console.error('Error de conexión:', err);
            setError('Error de conexión con el servidor');
        }
        
        console.log('Intento de login con:', {
            email: formData.correo_electronico,
        });
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Iniciar Sesión</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="correo_electronico">Correo Electrónico</label>
                        <input
                            type="email"
                            id="correo_electronico"
                            name="correo_electronico"
                            value={formData.correo_electronico}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
