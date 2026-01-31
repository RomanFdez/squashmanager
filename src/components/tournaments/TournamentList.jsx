import React from 'react';
import * as TournamentService from '../../services/TournamentService';
import './TournamentList.css';

const TournamentList = ({ tournaments, onEdit, onDelete, onViewBrackets }) => {
    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Borrador',
            open: 'Publicado',
            finished: 'Terminado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            draft: '📝',
            open: '✅',
            finished: '🏆',
            cancelled: '❌'
        };
        return icons[status] || '📋';
    };

    const getCategoryTypeIcon = (type) => {
        const icons = {
            masculina: '♂️',
            femenina: '♀️',
            mixta: '⚥'
        };
        return icons[type] || '🎾';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatPaymentTypes = (types) => {
        if (!types || types.length === 0) return '-';
        const labels = {
            efectivo: 'Efectivo',
            tarjeta: 'Tarjeta',
            transferencia: 'Transferencia'
        };
        return types.map(t => labels[t] || t).join(', ');
    };

    const canEdit = (tournament) => {
        // Only allow editing if tournament hasn't started yet
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(tournament.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate > today || tournament.status === 'draft';
    };

    if (!tournaments || tournaments.length === 0) {
        return (
            <div className="tournament-list empty">
                <span className="icon">🏆</span>
                <h3>No hay torneos</h3>
                <p>Crea tu primer torneo para empezar</p>
            </div>
        );
    }

    return (
        <div className="tournament-list">
            {tournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                    <div className="tournament-card-header">
                        <div className="tournament-card-title">
                            <h3>{tournament.name}</h3>
                            <span className={`tournament-status ${tournament.status}`}>
                                {getStatusIcon(tournament.status)} {getStatusLabel(tournament.status)}
                            </span>
                        </div>
                    </div>

                    <div className="tournament-card-info">
                        <div className="tournament-info-item">
                            <span className="label">📅 Fechas</span>
                            <span className="value">
                                {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                            </span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">⏰ Cierre Inscripciones</span>
                            <span className="value">{formatDate(tournament.registration_deadline)}</span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">📍 Ubicación</span>
                            <span className="value">{tournament.location || '-'}</span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">💰 Precio</span>
                            <span className="value">{tournament.price ? `${tournament.price}€` : 'Gratis'}</span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">💳 Métodos de Pago</span>
                            <span className="value">{formatPaymentTypes(tournament.payment_types)}</span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">🎾 Formato</span>
                            <span className="value">
                                {tournament.match_format === 'best_of_5' ? 'Mejor de 5 sets' : 'Mejor de 3 sets'}
                            </span>
                        </div>
                        <div className="tournament-info-item">
                            <span className="label">👥 Jugadores Inscritos</span>
                            <span className="value">
                                {(tournament.tournament_categories || []).reduce((acc, cat) =>
                                    acc + (cat.tournament_registrations || []).length, 0)}
                            </span>
                        </div>
                    </div>

                    {tournament.tournament_categories && tournament.tournament_categories.length > 0 && (
                        <div className="tournament-categories">
                            {tournament.tournament_categories.map(cat => (
                                <span key={cat.id} className="category-tag">
                                    <span className="type-icon">{getCategoryTypeIcon(cat.type)}</span>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="tournament-card-actions">
                        <button className="btn-secondary" onClick={() => onEdit(tournament)}>
                            ✏️ Editar
                        </button>
                        <button className="btn-secondary" onClick={() => onViewBrackets(tournament)}>
                            📊 Ver Cuadros
                        </button>
                        <button className="btn-danger" onClick={() => onDelete(tournament)}>
                            🗑️ Eliminar
                        </button>
                        <a
                            href={`/torneo/${tournament.public_slug || tournament.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary public-btn"
                            title="Ver página pública del torneo"
                            onClick={(e) => {
                                if (!tournament.public_slug) {
                                    e.preventDefault();
                                    alert('Este torneo no tiene un enlace público generado. Edita el torneo y guárdalo para generarlo.');
                                }
                            }}
                        >
                            🔗 Página Pública
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TournamentList;
