import React, { useState } from 'react';
import './MovementForm.css';

const MovementForm = ({ movement, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        concept: '',
        type: 'income', // income or expense
        ...movement
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.concept) return;
        onSave(formData);
    };

    return (
        <form className="movement-form card" onSubmit={handleSubmit}>
            <h3>{movement?.id ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>

            <div className="form-grid">
                <div className="form-group">
                    <label>Tipo</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="income">Ingreso</option>
                        <option value="expense">Gasto</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Importe (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group form-group-full">
                    <label>Concepto</label>
                    <input
                        type="text"
                        name="concept"
                        value={formData.concept}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Cuota mensual, Compra material..."
                    />
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
        </form>
    );
};

export default MovementForm;
