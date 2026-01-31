import React, { useState } from 'react';
import * as TournamentService from '../../../services/TournamentService';
import './StepCategories.css';

const StepCategories = ({ tournamentData, updateData, tournamentId }) => {
    const [editingCategory, setEditingCategory] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'masculina',
        age_group: 'todos',
        max_participants: '',
        has_group_phase: false,
        players_per_group: 4,
        advance_to_main: 1,
        advance_to_consolation: 0
    });

    const typeOptions = [
        { id: 'masculina', label: 'Masculina', icon: '♂️' },
        { id: 'femenina', label: 'Femenina', icon: '♀️' },
        { id: 'mixta', label: 'Mixta', icon: '⚥' }
    ];

    const ageGroupOptions = [
        { id: 'todos', label: 'Todos' },
        { id: 'sub7', label: 'Menores de 7' },
        { id: 'sub9', label: 'Menores de 9' },
        { id: 'sub11', label: 'Menores de 11' },
        { id: 'sub13', label: 'Menores de 13' },
        { id: 'sub15', label: 'Menores de 15' },
        { id: 'sub18', label: 'Menores de 18' }
    ];

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'masculina',
            age_group: 'todos',
            max_participants: '',
            has_group_phase: false,
            players_per_group: 4,
            advance_to_main: 1,
            advance_to_consolation: 0
        });
        setEditingCategory(null);
        setShowForm(false);
    };

    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name || '',
            type: category.type || 'masculina',
            age_group: category.age_group || 'todos',
            max_participants: category.max_participants || '',
            has_group_phase: category.has_group_phase || false,
            players_per_group: category.players_per_group || 4,
            advance_to_main: category.advance_to_main || 1,
            advance_to_consolation: category.advance_to_consolation || 0
        });
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('Por favor, introduce el nombre de la categoría');
            return;
        }

        try {
            if (editingCategory) {
                // Update
                const updated = await TournamentService.updateCategory(editingCategory.id, formData);
                updateData('categories', tournamentData.categories.map(c =>
                    c.id === editingCategory.id ? { ...c, ...updated } : c
                ));
            } else {
                // Create
                const created = await TournamentService.createCategory(tournamentId, formData);
                updateData('categories', [...tournamentData.categories, created]);
            }
            resetForm();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error al guardar la categoría');
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

        try {
            await TournamentService.deleteCategory(category.id);
            updateData('categories', tournamentData.categories.filter(c => c.id !== category.id));
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error al eliminar la categoría');
        }
    };

    const getTypeIcon = (type) => {
        return typeOptions.find(t => t.id === type)?.icon || '🎾';
    };

    const getAgeGroupLabel = (ageGroup) => {
        return ageGroupOptions.find(a => a.id === ageGroup)?.label || ageGroup;
    };

    return (
        <div className="step-categories">
            <div className="categories-intro">
                <h3>🏷️ Categorías del Torneo</h3>
                <p>Define las categorías en las que se competirá</p>
            </div>

            {/* Categories List */}
            <div className="categories-list">
                {tournamentData.categories.length === 0 && !showForm ? (
                    <div className="empty-categories">
                        <span className="icon">🏷️</span>
                        <p>No hay categorías definidas</p>
                        <button className="btn-primary" onClick={handleAddNew}>
                            ➕ Añadir Primera Categoría
                        </button>
                    </div>
                ) : (
                    <>
                        {tournamentData.categories.map((cat, index) => (
                            <div key={cat.id} className="category-card">
                                <div className="category-header">
                                    <span className="category-number">#{index + 1}</span>
                                    <h4>{getTypeIcon(cat.type)} {cat.name}</h4>
                                    <div className="category-actions">
                                        <button className="btn-icon" onClick={() => handleEdit(cat)}>✏️</button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(cat)}>🗑️</button>
                                    </div>
                                </div>
                                <div className="category-details">
                                    <span className="detail-item">
                                        <label>Tipo:</label> {typeOptions.find(t => t.id === cat.type)?.label}
                                    </span>
                                    <span className="detail-item">
                                        <label>Edad:</label> {getAgeGroupLabel(cat.age_group)}
                                    </span>
                                    {cat.max_participants && (
                                        <span className="detail-item">
                                            <label>Máx:</label> {cat.max_participants} jugadores
                                        </span>
                                    )}
                                    {cat.has_group_phase && (
                                        <span className="detail-item groups">
                                            <label>Fase de Grupos:</label> {cat.players_per_group} jug/grupo
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Add Button */}
            {tournamentData.categories.length > 0 && !showForm && (
                <button className="add-category-btn" onClick={handleAddNew}>
                    ➕ Añadir Categoría
                </button>
            )}

            {/* Category Form */}
            {showForm && (
                <div className="category-form">
                    <h4>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre de la Categoría *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Absoluta A, Veteranos +40..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo *</label>
                            <div className="type-selector">
                                {typeOptions.map(opt => (
                                    <label
                                        key={opt.id}
                                        className={`type-option ${formData.type === opt.id ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={opt.id}
                                            checked={formData.type === opt.id}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        />
                                        <span className="icon">{opt.icon}</span>
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Grupo de Edad</label>
                            <select
                                value={formData.age_group}
                                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                            >
                                {ageGroupOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Límite de Participantes</label>
                            <input
                                type="number"
                                value={formData.max_participants}
                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                placeholder="Sin límite"
                                min="2"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}>
                            {editingCategory ? 'Guardar Cambios' : 'Añadir Categoría'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepCategories;
