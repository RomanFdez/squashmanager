import React, { useState } from 'react';
import * as TournamentService from '../../../services/TournamentService';

const StepInfo = ({ tournamentData, updateData, tournamentId }) => {
    const [newCourtName, setNewCourtName] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateData(name, value);
    };

    const handlePaymentTypeToggle = (type) => {
        const current = tournamentData.payment_types || [];
        if (current.includes(type)) {
            // Don't allow removing the last one
            if (current.length > 1) {
                updateData('payment_types', current.filter(t => t !== type));
            }
        } else {
            updateData('payment_types', [...current, type]);
        }
    };

    const handleAddCourt = async () => {
        if (!newCourtName.trim()) return;

        if (tournamentId) {
            try {
                const court = await TournamentService.addCourt(tournamentId, newCourtName);
                updateData('courts', [...tournamentData.courts, court]);
            } catch (error) {
                console.error('Error adding court:', error);
            }
        } else {
            // If tournament not yet saved, just add locally
            updateData('courts', [
                ...tournamentData.courts,
                { id: Date.now(), name: newCourtName, isNew: true }
            ]);
        }
        setNewCourtName('');
    };

    const handleRemoveCourt = async (court) => {
        if (court.isNew || !tournamentId) {
            updateData('courts', tournamentData.courts.filter(c => c.id !== court.id));
        } else {
            try {
                await TournamentService.deleteCourt(court.id);
                updateData('courts', tournamentData.courts.filter(c => c.id !== court.id));
            } catch (error) {
                console.error('Error removing court:', error);
            }
        }
    };

    const paymentTypes = [
        { id: 'efectivo', label: 'Efectivo', icon: '💵' },
        { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
        { id: 'transferencia', label: 'Transferencia', icon: '🏦' }
    ];

    return (
        <div className="wizard-form">
            {/* Basic Info Section */}
            <div className="form-section">
                <h3 className="form-section-title">
                    <span>📋</span> Información Básica
                </h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Nombre del Torneo *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={tournamentData.name}
                            onChange={handleInputChange}
                            placeholder="Ej: I Torneo de Navidad"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">Fecha de Inicio *</label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={tournamentData.start_date}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end_date">Fecha de Fin *</label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={tournamentData.end_date}
                            onChange={handleInputChange}
                            min={tournamentData.start_date}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="registration_deadline">Cierre de Inscripciones *</label>
                        <input
                            type="date"
                            id="registration_deadline"
                            name="registration_deadline"
                            value={tournamentData.registration_deadline}
                            onChange={handleInputChange}
                            max={tournamentData.start_date}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="location">Ubicación *</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={tournamentData.location}
                            onChange={handleInputChange}
                            placeholder="Ej: Polideportivo Municipal"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="status">Estado del Torneo *</label>
                        <select
                            id="status"
                            name="status"
                            value={tournamentData.status || 'draft'}
                            onChange={handleInputChange}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                background: 'var(--bg-color)'
                            }}
                        >
                            <option value="draft">📝 Borrador</option>
                            <option value="open">✅ Publicado</option>
                            <option value="finished">🏆 Terminado</option>
                            <option value="cancelled">❌ Cancelado</option>
                        </select>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Las inscripciones están abiertas cuando el estado es <strong>Borrador</strong> o <strong>Publicado</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Courts Section */}
            <div className="form-section">
                <h3 className="form-section-title">
                    <span>🎾</span> Pistas
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Añade las pistas donde se jugarán los partidos
                </p>

                <div className="dynamic-list">
                    {tournamentData.courts.map((court, index) => (
                        <div key={court.id} className="dynamic-list-item">
                            <span style={{ color: 'var(--text-secondary)' }}>#{index + 1}</span>
                            <input
                                type="text"
                                value={court.name}
                                readOnly
                            />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => handleRemoveCourt(court)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <div className="dynamic-list-item">
                        <span style={{ color: 'var(--text-secondary)' }}>+</span>
                        <input
                            type="text"
                            value={newCourtName}
                            onChange={(e) => setNewCourtName(e.target.value)}
                            placeholder="Nombre de la pista"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCourt()}
                        />
                        <button
                            type="button"
                            className="add-item-btn"
                            onClick={handleAddCourt}
                            style={{ padding: '0.25rem 0.75rem', border: 'none', background: 'var(--accent-color)', color: 'white', borderRadius: '6px' }}
                        >
                            Añadir
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="form-section">
                <h3 className="form-section-title">
                    <span>💰</span> Precio e Inscripción
                </h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="price">Precio de Inscripción (€)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={tournamentData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Métodos de Pago Aceptados</label>
                    <div className="checkbox-group">
                        {paymentTypes.map(pt => (
                            <label
                                key={pt.id}
                                className={`checkbox-item ${tournamentData.payment_types?.includes(pt.id) ? 'selected' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={tournamentData.payment_types?.includes(pt.id) || false}
                                    onChange={() => handlePaymentTypeToggle(pt.id)}
                                />
                                <span className="checkbox-icon">
                                    {tournamentData.payment_types?.includes(pt.id) ? '✓' : ''}
                                </span>
                                <span>{pt.icon} {pt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Match Format Section */}
            <div className="form-section">
                <h3 className="form-section-title">
                    <span>🏆</span> Formato de Partidos
                </h3>

                <div className="form-group">
                    <label>Formato de Sets</label>
                    <div className="radio-group">
                        <label
                            className={`radio-item ${tournamentData.match_format === 'best_of_3' ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="match_format"
                                value="best_of_3"
                                checked={tournamentData.match_format === 'best_of_3'}
                                onChange={handleInputChange}
                            />
                            <span>🎾 Mejor de 3 sets</span>
                        </label>
                        <label
                            className={`radio-item ${tournamentData.match_format === 'best_of_5' ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="match_format"
                                value="best_of_5"
                                checked={tournamentData.match_format === 'best_of_5'}
                                onChange={handleInputChange}
                            />
                            <span>🏆 Mejor de 5 sets</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Visibility Section */}
            <div className="form-section">
                <h3 className="form-section-title">
                    <span>👁️</span> Visibilidad
                </h3>

                <div className="form-group">
                    <label className={`checkbox-item ${tournamentData.is_public ? 'selected' : ''}`} style={{ display: 'inline-flex' }}>
                        <input
                            type="checkbox"
                            checked={tournamentData.is_public || false}
                            onChange={(e) => updateData('is_public', e.target.checked)}
                        />
                        <span className="checkbox-icon">
                            {tournamentData.is_public ? '✓' : ''}
                        </span>
                        <span>🌐 Torneo Público (visible para todos)</span>
                    </label>
                </div>

                {tournamentData.public_slug && (
                    <div className="public-link-info">
                        <label>Enlace de la página pública:</label>
                        <div className="link-preview">
                            <a
                                href={`/torneo/${tournamentData.public_slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {window.location.origin}/torneo/{tournamentData.public_slug}
                            </a>
                            <button
                                type="button"
                                className="copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/torneo/${tournamentData.public_slug}`);
                                    alert('¡Enlace copiado!');
                                }}
                            >
                                📋 Copiar
                            </button>
                        </div>
                        {!tournamentData.is_public && (
                            <p className="warning-text">⚠️ El torneo debe estar en modo público para que otros puedan verlo.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepInfo;
