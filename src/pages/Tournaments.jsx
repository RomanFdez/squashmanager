import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TournamentWizard from '../components/tournaments/TournamentWizard';
import TournamentList from '../components/tournaments/TournamentList';
import TournamentBracketView from '../components/tournaments/TournamentBracketView';
import * as TournamentService from '../services/TournamentService';
import './Tournaments.css';

const Tournaments = () => {
    const { isAdmin } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'wizard', 'brackets'
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [editingTournament, setEditingTournament] = useState(null);

    useEffect(() => {
        loadTournaments();
    }, []);

    const loadTournaments = async () => {
        try {
            setLoading(true);
            const data = await TournamentService.getTournaments();
            setTournaments(data);
        } catch (error) {
            console.error('Error loading tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingTournament(null);
        setView('wizard');
    };

    const handleEdit = async (tournament) => {
        try {
            const fullTournament = await TournamentService.getTournamentById(tournament.id);
            setEditingTournament(fullTournament);
            setView('wizard');
        } catch (error) {
            console.error('Error loading tournament:', error);
        }
    };

    const handleViewBrackets = async (tournament) => {
        try {
            const fullTournament = await TournamentService.getTournamentById(tournament.id);
            setSelectedTournament(fullTournament);
            setView('brackets');
        } catch (error) {
            console.error('Error loading tournament:', error);
        }
    };

    const handleDelete = async (tournament) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournament.name}"?`)) {
            return;
        }
        try {
            await TournamentService.deleteTournament(tournament.id);
            loadTournaments();
        } catch (error) {
            console.error('Error deleting tournament:', error);
            alert('Error al eliminar el torneo');
        }
    };

    const handleWizardComplete = () => {
        setView('list');
        setEditingTournament(null);
        loadTournaments();
    };

    const handleWizardCancel = () => {
        setView('list');
        setEditingTournament(null);
    };

    const handleBackFromBrackets = () => {
        setView('list');
        setSelectedTournament(null);
    };

    if (!isAdmin) {
        return (
            <div className="tournaments-page">
                <div className="access-denied">
                    <span className="icon">🔒</span>
                    <h2>Acceso Restringido</h2>
                    <p>Solo los administradores pueden acceder a la gestión de torneos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tournaments-page">
            {view === 'list' && (
                <>
                    <div className="page-header">
                        <h1>🏆 Gestión de Torneos</h1>
                        <button className="btn-primary" onClick={handleCreateNew}>
                            <span className="icon">➕</span>
                            Nuevo Torneo
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando torneos...</p>
                        </div>
                    ) : (
                        <TournamentList
                            tournaments={tournaments}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onViewBrackets={handleViewBrackets}
                        />
                    )}
                </>
            )}

            {view === 'wizard' && (
                <TournamentWizard
                    tournament={editingTournament}
                    onComplete={handleWizardComplete}
                    onCancel={handleWizardCancel}
                />
            )}

            {view === 'brackets' && selectedTournament && (
                <TournamentBracketView
                    tournament={selectedTournament}
                    onBack={handleBackFromBrackets}
                    onUpdate={loadTournaments}
                />
            )}
        </div>
    );
};

export default Tournaments;
