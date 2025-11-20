import React, { useState } from 'react';

function CocineroForm({ restauranteId, onClose }) {
    const [form, setForm] = useState({
        nombre: '',
        correo_electronico: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await fetch('http://entremesa-backend.test/api/cocinero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id_restaurante: restauranteId })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Cocinero agregado correctamente');
                setForm({ nombre: '', correo_electronico: '', password: '' });
            } else {
                setError(data.message || 'Error al agregar cocinero');
            }
        } catch (err) {
            setError('Error de conexión');
        }
    };

    return (
        <div className="modal-form">
            <h2>Agregar Cocinero</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit}>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
                <input name="correo_electronico" value={form.correo_electronico} onChange={handleChange} placeholder="Correo electrónico" required />
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña" required />
                <button type="submit">Agregar</button>
                <button type="button" onClick={onClose}>Cancelar</button>
            </form>
        </div>
    );
}

export default CocineroForm;
