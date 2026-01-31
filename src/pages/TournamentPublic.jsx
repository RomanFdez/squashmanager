import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as TournamentService from '../services/TournamentService';
import TournamentBracketView from '../components/tournaments/TournamentBracketView';
import './TournamentPublic.css';

const TournamentPublic = () => {
    const { slug } = useParams();
    const { user, logout } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTournament();
    }, [slug]);

    const loadTournament = async () => {
        try {
            // Only set loading if we don't have data yet
            if (!tournament) setLoading(true);

            const data = await TournamentService.getTournamentBySlug(slug);
            if (!data) {
                setError('Torneo no encontrado.');
                return;
            }
            setTournament(data);
        } catch (err) {
            console.error('Error loading public tournament:', err);
            setError(`Error: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            try {
                await logout();
            } catch (err) {
                console.error('Error logging out:', err);
            }
        }
    };

    if (loading && !tournament) {
        return (
            <div className="public-loading">
                <div className="spinner"></div>
                <p>Cargando torneo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-error">
                <span className="icon">⚠️</span>
                <h2>{error}</h2>
                <button onClick={() => window.location.href = '/'}>Volver al inicio</button>
            </div>
        );
    }

    return (
        <div className="tournament-public-page">
            <header className="public-page-header">
                <div className="header-content">
                    <span className="header-tournament-name">🏆 {tournament?.name || 'Torneo'}</span>
                    <div className="header-actions">
                        {user ? (
                            <div className="user-nav">
                                <span className="user-info">
                                    <User size={16} />
                                    <span className="user-name">{user.user_metadata?.name || user.email}</span>
                                </span>
                                <button onClick={handleLogout} className="header-logout-btn" title="Cerrar Sesión">
                                    <LogOut size={16} />
                                    <span className="logout-text">Salir</span>
                                </button>
                            </div>
                        ) : (
                            <Link to={`/login?redirect=/torneo/${slug}`} className="header-login-btn">
                                🔐 Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <div className="public-container">
                <TournamentBracketView
                    tournament={tournament}
                    isPublicView={true}
                    onUpdate={() => loadTournament()}
                />
            </div>
        </div>
    );
};

export default TournamentPublic;
