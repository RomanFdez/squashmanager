import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as TournamentService from '../services/TournamentService';
import TournamentBracketView from '../components/tournaments/TournamentBracketView';
import './TournamentPublic.css';

const TournamentPublic = () => {
    const { slug } = useParams();
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
