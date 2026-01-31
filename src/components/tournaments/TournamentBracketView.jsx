import React, { useState, useEffect } from 'react';
import * as TournamentService from '../../services/TournamentService';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './TournamentBracketView.css';

const TournamentBracketView = ({ tournament, onBack, onUpdate, isPublicView = false }) => {
    const { isAdmin, user } = useAuth();
    const [activeTab, setActiveTab] = useState(isPublicView ? 'info' : (tournament.tournament_categories?.[0]?.id || 'info'));
    const [brackets, setBrackets] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState([]);
    const [showDetailedScore, setShowDetailedScore] = useState(false);

    // Registration states for public view
    const [registeringCategory, setRegisteringCategory] = useState(null);
    const [externalForm, setExternalForm] = useState({ name: '', email: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);
    const [activeSponsorIndex, setActiveSponsorIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSponsorIndex(prev => prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const categories = tournament.tournament_categories || [];
    const selectedCategory = categories.find(c => c.id === activeTab);
    const matchFormat = tournament.match_format === 'best_of_5' ? 5 : 3;
    const setsToWin = Math.ceil(matchFormat / 2);

    useEffect(() => {
        if (activeTab && activeTab !== 'info') {
            loadBrackets(activeTab);
        }
    }, [activeTab]);

    const loadBrackets = async (categoryId) => {
        try {
            setLoading(true);
            const data = await TournamentService.getBrackets(categoryId);
            setBrackets(data || []);

            // Also load groups
            const groupsData = await TournamentService.getGroups(categoryId);
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Error loading brackets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Borrador',
            open: 'Inscripciones Abiertas',
            in_progress: 'En Curso',
            finished: 'Finalizado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    const getCategoryTypeIcon = (type) => {
        const icons = { masculina: '♂️', femenina: '♀️', mixta: '⚥' };
        return icons[type] || '🏆';
    };

    const getPlayerName = (player) => {
        if (!player) return 'BYE';
        if (player.member?.name) return player.member.name;
        if (player.external_player?.name) return player.external_player.name;
        return player.registration_name || 'TBD';
    };

    const getDetailedScore = (match, playerNum) => {
        if (!match.score || match.score.length === 0) return '';
        const validSets = match.score.filter(s => s.p1 !== undefined && s.p2 !== undefined && s.p1 !== null && s.p2 !== null && (s.p1 !== '' || s.p2 !== ''));
        return validSets.map(set => playerNum === 1 ? set.p1 : set.p2).join('  ');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const checkRegistrationOpen = () => {
        console.log('🔍 Checking registration status:', {
            status: tournament.status,
            deadline: tournament.registration_deadline,
            now: new Date().toISOString()
        });

        // Allow registrations for draft or published (open) tournaments
        if (!['draft', 'open'].includes(tournament.status)) {
            console.log('❌ Registration closed: status is', tournament.status);
            return false;
        }
        if (!tournament.registration_deadline) {
            console.log('✅ Registration open: no deadline set');
            return true;
        }

        // Handle both YYYY-MM-DD and ISO strings types
        const dateStr = typeof tournament.registration_deadline === 'string'
            ? tournament.registration_deadline.split('T')[0]
            : '';

        if (!dateStr) {
            console.log('❌ Registration closed: invalid date string');
            return false;
        }

        const [year, month, day] = dateStr.split('-').map(Number);
        const deadline = new Date(year, month - 1, day);
        deadline.setHours(23, 59, 59, 999);

        const isOpen = deadline >= new Date();
        console.log(isOpen ? '✅ Registration open' : '❌ Registration closed: past deadline', {
            deadline: deadline.toISOString(),
            now: new Date().toISOString()
        });

        return isOpen;
    };

    const isRegistrationOpen = checkRegistrationOpen();

    // Registration Handlers
    const handleRegister = async (category) => {
        if (!user) {
            setRegisteringCategory(category);
            return;
        }

        try {
            setSubmitting(true);
            if (user.id && user.id !== 'admin_sys') {
                await TournamentService.registerMember(category.id, user.id, {
                    registration_name: user.name,
                    registration_email: user.email,
                    registration_phone: user.phone || ''
                });
                alert('¡Inscripción realizada con éxito!');
                onUpdate?.();
            } else {
                setRegisteringCategory(category);
            }
        } catch (error) {
            console.error('Error registering:', error);
            if (error.code === '23505') {
                alert('Ya estás inscrito en esta categoría.');
            } else {
                alert('Error al realizar la inscripción.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleExternalRegister = async (e) => {
        e.preventDefault();

        // Validate name
        if (!externalForm.name.trim()) {
            alert('Por favor, introduce tu nombre.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!externalForm.email.trim()) {
            alert('Por favor, introduce tu email.');
            return;
        }
        if (!emailRegex.test(externalForm.email)) {
            alert('Por favor, introduce un email válido.');
            return;
        }

        // Validate phone format (Spanish phone numbers: 9 digits, can have spaces or dashes)
        const phoneRegex = /^[6-9]\d{8}$/;
        const cleanPhone = externalForm.phone.replace(/[\s-]/g, '');
        if (!externalForm.phone.trim()) {
            alert('Por favor, introduce tu teléfono.');
            return;
        }
        if (!phoneRegex.test(cleanPhone)) {
            alert('Por favor, introduce un teléfono válido (9 dígitos, empezando por 6, 7, 8 o 9).');
            return;
        }

        try {
            setSubmitting(true);
            await TournamentService.registerExternalPlayer(registeringCategory.id, {
                name: externalForm.name.trim(),
                email: externalForm.email.trim(),
                phone: cleanPhone
            });
            alert('¡Inscripción realizada con éxito!');
            setRegisteringCategory(null);
            setExternalForm({ name: '', email: '', phone: '' });
            onUpdate?.();
        } catch (error) {
            console.error('Error registering external:', error);
            alert('Error al realizar la inscripción.');
        } finally {
            setSubmitting(false);
        }
    };

    const getRoundName = (round, matches = []) => {
        if (round === 1 && matches.some(m => m.position === 2)) {
            return 'Final y 3º/4º';
        }

        const names = {
            1: 'Final',
            2: 'Semifinales',
            4: 'Cuartos',
            8: 'Octavos',
            16: 'Dieciseisavos',
            32: 'Treintaidosavos'
        };
        return names[round] || `Ronda de ${round}`;
    };

    const openScoreModal = (match) => {
        if (!match.player1_id || !match.player2_id) return;
        setSelectedMatch(match);
        const initialScore = match.score || [];
        const extendedScore = [...initialScore];
        while (extendedScore.length < matchFormat) {
            extendedScore.push({ p1: '', p2: '' });
        }
        setScoreInput(extendedScore);
        setShowScoreModal(true);
    };

    const handleScoreChange = (setIndex, player, value) => {
        const newScore = [...scoreInput];
        newScore[setIndex] = {
            ...newScore[setIndex],
            [player]: value === '' ? '' : parseInt(value) || 0
        };
        setScoreInput(newScore);
    };

    const getWinnerFromScore = () => {
        let p1Sets = 0;
        let p2Sets = 0;
        scoreInput.forEach(set => {
            if (set.p1 !== '' && set.p2 !== '') {
                if (set.p1 > set.p2) p1Sets++;
                else if (set.p2 > set.p1) p2Sets++;
            }
        });
        if (p1Sets === setsToWin) return selectedMatch.player1_id;
        if (p2Sets === setsToWin) return selectedMatch.player2_id;
        return null;
    };

    const handleSubmitScore = async () => {
        const winnerId = getWinnerFromScore();
        if (!winnerId) return;

        try {
            setSubmitting(true);
            const filteredScore = scoreInput.filter(set => set.p1 !== '' && set.p2 !== '');
            const summary = filteredScore.map(s => `${s.p1}-${s.p2}`).join(', ');

            if (selectedMatch.isGroupMatch) {
                await TournamentService.updateGroupMatch(selectedMatch.id, {
                    winner_id: winnerId,
                    score: filteredScore,
                    score_summary: summary,
                    status: 'completed'
                });
            } else {
                await TournamentService.recordMatchResult(selectedMatch.id, winnerId, filteredScore);
            }
            setShowScoreModal(false);
            onUpdate?.();
            loadBrackets(activeTab);
        } catch (error) {
            console.error('Error updating score:', error);
            alert('Error al guardar el resultado.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearResult = async () => {
        if (!confirm('¿Estás seguro de que quieres borrar el resultado de este partido?')) return;
        try {
            setSubmitting(true);
            if (selectedMatch.isGroupMatch) {
                await TournamentService.updateGroupMatch(selectedMatch.id, {
                    winner_id: null,
                    score: null,
                    score_summary: null,
                    status: 'pending'
                });
            } else {
                await TournamentService.clearMatchResult(selectedMatch.id);
            }
            setShowScoreModal(false);
            onUpdate?.();
            loadBrackets(activeTab);
        } catch (error) {
            console.error('Error clearing result:', error);
            alert('Error al borrar el resultado.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetirement = async (playerNum) => {
        const retiredPlayerId = playerNum === 1 ? selectedMatch.player1_id : selectedMatch.player2_id;
        const winnerId = playerNum === 1 ? selectedMatch.player2_id : selectedMatch.player1_id;
        const playerName = playerNum === 1 ? getPlayerName(selectedMatch.player1) : getPlayerName(selectedMatch.player2);

        if (!confirm(`¿Confirmar retirada (W.O.) de ${playerName}?`)) return;

        try {
            setSubmitting(true);
            await TournamentService.markMatchRetirement(selectedMatch.id, retiredPlayerId, winnerId);
            setShowScoreModal(false);
            onUpdate?.();
            loadBrackets(activeTab);
        } catch (error) {
            console.error('Error marking retirement:', error);
            alert('Error al marcar la retirada.');
        } finally {
            setSubmitting(false);
        }
    };

    const getScoreDisplay = (match, playerNum) => {
        if (match.status === 'retired') {
            return match.winner_id === (playerNum === 1 ? match.player1_id : match.player2_id) ? 'W' : 'O';
        }
        if (!match.score || match.score.length === 0) return '-';
        let setsWon = 0;
        match.score.forEach(set => {
            const p1 = parseFloat(set.p1); // Use parseFloat to handle numeric strings safely
            const p2 = parseFloat(set.p2);
            if (!isNaN(p1) && !isNaN(p2)) { // Ensure valid numbers
                if (playerNum === 1 && p1 > p2) setsWon++;
                if (playerNum === 2 && p2 > p1) setsWon++;
            }
        });
        return setsWon;
    };

    const renderMatch = (match, bracket) => {
        const isCompleted = match.status === 'completed' || match.status === 'retired';
        const isClickable = (isAdmin || !isPublicView) && match.player1_id && match.player2_id;
        const p1Name = getPlayerName(match.player1);
        const p2Name = getPlayerName(match.player2);

        // Classification labels removed for cleaner UI

        const renderScore = (playerNum) => {
            if (showDetailedScore) {
                const sets = (match.score || []).filter(s =>
                    s.p1 !== undefined && s.p2 !== undefined && s.p1 !== null && s.p2 !== null && (s.p1 !== '' || s.p2 !== '')
                );

                if (sets.length === 0) return <span className="set-score empty"></span>;

                return (
                    <div className="detailed-sets">
                        {sets.map((set, i) => {
                            const p1Val = parseInt(set.p1 || 0);
                            const p2Val = parseInt(set.p2 || 0);
                            const isWon = playerNum === 1 ? p1Val > p2Val : p2Val > p1Val;
                            return (
                                <span key={i} className={`mini-set ${isWon ? 'won' : ''}`}>
                                    {playerNum === 1 ? set.p1 : set.p2}
                                </span>
                            );
                        })}
                    </div>
                );
            }

            return (
                <span className="set-score">
                    {getScoreDisplay(match, playerNum)}
                </span>
            );
        };

        return (
            <div
                className={`match-card bracket-match ${isClickable ? 'clickable' : ''} ${isCompleted ? 'completed' : ''} ${match.status === 'retired' ? 'retired' : ''} ${showDetailedScore ? 'detailed-mode' : ''}`}
                onClick={() => isClickable && openScoreModal(match)}
            >
                <div className={`player-slot ${match.winner_id === match.player1_id ? 'winner' : ''} ${!match.player1_id ? 'bye' : ''}`}>
                    <span className="player-name">{p1Name}</span>
                    {match.player1_id && renderScore(1)}
                </div>

                <div className={`player-slot ${match.winner_id === match.player2_id ? 'winner' : ''} ${!match.player2_id ? 'bye' : ''}`}>
                    <span className="player-name">{p2Name}</span>
                    {match.player2_id && renderScore(2)}
                </div>

                {isClickable && (
                    <div className="enter-score-hint">
                        {isCompleted ? 'Editar resultado' : 'Introducir resultado'}
                    </div>
                )}


            </div>
        );
    };

    const renderBracket = (bracket) => {
        const matches = bracket.tournament_matches || [];
        const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => b - a);
        const roundMap = {};
        matches.forEach(m => {
            if (!roundMap[m.round]) roundMap[m.round] = [];
            roundMap[m.round].push(m);
        });

        return (
            <div className="bracket-view live-mode">
                {rounds.map(round => {
                    const roundMatches = roundMap[round].sort((a, b) => a.position - b.position);

                    return (
                        <div className="bracket-round" key={round}>
                            <div className="round-header">{getRoundName(round, roundMatches)}</div>
                            <div className="round-matches">
                                {roundMatches.map(match => (
                                    <div key={match.id}>
                                        {renderMatch(match, bracket)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderGroups = () => (
        <div className="groups-view">
            {groups.map(group => (
                <div key={group.id} className="group-card">
                    <h4 className="group-title">{group.name}</h4>
                    <table className="standings-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Jugador</th>
                                <th>Pts</th>
                                <th>P</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.tournament_group_players
                                ?.sort((a, b) => (a.position - b.position) || (b.points - a.points))
                                .map((p, idx) => (
                                    <tr key={p.id}>
                                        <td>{idx + 1}</td>
                                        <td>{getPlayerName(p.registration)}</td>
                                        <td className="center">{p.points}</td>
                                        <td className="center">{p.games_won + p.games_lost}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    <div className="group-matches-preview">
                        <h5 className="mini-header">Partidos</h5>
                        <div className="mini-matches-list">
                            {group.tournament_group_matches?.map(m => {
                                const p1 = group.tournament_group_players.find(p => p.registration_id === m.player1_id)?.registration;
                                const p2 = group.tournament_group_players.find(p => p.registration_id === m.player2_id)?.registration;
                                const matchWithPlayers = {
                                    ...m,
                                    player1: p1,
                                    player2: p2,
                                    isGroupMatch: true
                                };
                                const isClickable = (isAdmin || !isPublicView);
                                return (
                                    <div
                                        key={m.id}
                                        className={`mini-match-row ${m.status === 'completed' ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                                        onClick={() => isClickable && openScoreModal(matchWithPlayers)}
                                    >
                                        <div className="match-content">
                                            <span>{getPlayerName(p1)}</span>
                                            {m.score_summary ? (
                                                <span className="score-summary">{m.score_summary}</span>
                                            ) : (
                                                <span className="vs">vs</span>
                                            )}
                                            <span>{getPlayerName(p2)}</span>
                                        </div>
                                        {isClickable && (
                                            <div className="enter-score-hint">
                                                {m.status === 'completed' ? 'Editar resultado' : 'Introducir resultado'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderInfo = () => {
        return (
            <div className="public-info-view">
                <div className="info-grid">
                    <div className="info-main">
                        {/* Poster and Sponsors Section */}


                        <div className="info-top-row">
                            <div className="info-section details-section">
                                <h3>📅 Detalles del Torneo</h3>
                                <div className="info-items-grid">
                                    <div className="info-item">
                                        <span className="label">UBICACIÓN</span>
                                        <span className="value">{tournament.location || 'Palacio de los deportes'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">FORMATO</span>
                                        <span className="value">Al mejor de {matchFormat} sets</span>
                                    </div>

                                    <div className="info-item">
                                        <span className="label">INICIO</span>
                                        <span className="value">{formatDate(tournament.start_date)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">FIN</span>
                                        <span className="value">{formatDate(tournament.end_date)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">CIERRE INSCRIPCIONES</span>
                                        <span className="value">{formatDate(tournament.registration_deadline)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">PRECIO</span>
                                        <span className="value">{tournament.price ? `${tournament.price}€` : 'Gratis'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Club Logo Block */}
                            {tournament.tournament_images?.find(img => img.slot_number === 2) && (
                                <div className="info-section logo-section">
                                    <div className="club-logo-wrapper">
                                        <img
                                            src={tournament.tournament_images.find(img => img.slot_number === 2).club_image.image_url}
                                            alt="Logo del Club"
                                            className="club-logo-img"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="info-section">
                            <h3>📝 Inscripción</h3>
                            {registeringCategory ? (
                                <div className="registration-panel">
                                    <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h4>Inscribirse en {registeringCategory.name}</h4>
                                        <button className="btn-text" onClick={() => setRegisteringCategory(null)}>Volver</button>
                                    </div>
                                    {!user && (
                                        <div className="login-prompt" style={{ marginBottom: '1.5rem' }}>
                                            <p>¿Tienes cuenta? <Link to="/login">Inicia sesión</Link> para inscribirte más rápido.</p>
                                        </div>
                                    )}
                                    <form className="registration-form" onSubmit={handleExternalRegister}>
                                        <div className="form-group">
                                            <label>Nombre Completo</label>
                                            <input
                                                type="text"
                                                required
                                                value={externalForm.name}
                                                onChange={e => setExternalForm({ ...externalForm, name: e.target.value })}
                                                placeholder="Ej: Juan Pérez"
                                            />
                                        </div>
                                        <div className="form-row-grid">
                                            <div className="form-group">
                                                <label>Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={externalForm.email}
                                                    onChange={e => setExternalForm({ ...externalForm, email: e.target.value })}
                                                    placeholder="juan@ejemplo.com"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Teléfono *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={externalForm.phone}
                                                    onChange={e => setExternalForm({ ...externalForm, phone: e.target.value })}
                                                    placeholder="600123456"
                                                    pattern="[6-9][0-9]{8}"
                                                    title="Introduce un teléfono válido (9 dígitos)"
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn-primary" disabled={submitting}>
                                            {submitting ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="public-categories">
                                    {categories.map(cat => {
                                        const isRegistered = user && cat.tournament_registrations?.some(r => r.member_id === user.id);
                                        const isFull = cat.max_participants && (cat.tournament_registrations?.length >= cat.max_participants);

                                        return (
                                            <div key={cat.id} className="public-category-card">
                                                <div className="cat-info">
                                                    <div className="cat-text">
                                                        <div className="cat-name">{cat.name}</div>
                                                        <div className="cat-details">
                                                            {cat.tournament_registrations?.length || 0} inscritos {cat.max_participants ? `/ Máx. ${cat.max_participants}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isRegistrationOpen ? (
                                                    isRegistered ? (
                                                        <span className="status-badge success">✓ Ya inscrito</span>
                                                    ) : isFull ? (
                                                        <span className="status-badge error">Completo</span>
                                                    ) : (
                                                        <button className="btn-primary" onClick={() => handleRegister(cat)}>
                                                            Inscribirme
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="status-badge muted">Inscripciones Cerradas</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>


                    </div>

                    <div className="info-sidebar">
                        {/* Sponsors Carousel */}
                        {(() => {
                            const sponsorImages = tournament.tournament_images?.filter(img => img.slot_number >= 3) || [];
                            if (sponsorImages.length === 0) return null;
                            const currentSponsor = sponsorImages[activeSponsorIndex % sponsorImages.length];

                            return (
                                <div className="info-section" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}>Colaboradores</h4>
                                    <div style={{ width: '100%', aspectRatio: '1/1', maxWidth: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img
                                            key={currentSponsor.id}
                                            src={currentSponsor.club_image.image_url}
                                            alt={currentSponsor.club_image.name || 'Patrocinador'}
                                            className="sponsor-carousel-img fade-in"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="info-section">
                            <h3>👥 Jugadores Inscritos</h3>
                            <div className="registered-players-list">
                                {categories.map(cat => (
                                    <div key={cat.id} className="cat-players-group">
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-color)', marginBottom: '0.5rem', marginTop: '1rem' }}>
                                            {cat.name} ({cat.tournament_registrations?.length || 0})
                                        </h4>
                                        {cat.tournament_registrations && cat.tournament_registrations.length > 0 ? (
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {cat.tournament_registrations.map(reg => (
                                                    <li key={reg.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                                        {reg.registration_name || reg.member?.name || (reg.external_player?.name || 'Jugador')}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No hay jugadores inscritos.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const mainBracket = brackets.find(b => b.bracket_type === 'main');
    const thirdPlaceBracket = brackets.find(b => b.name === 'Puestos 3-4');
    const consolationBrackets = brackets.filter(b => b.bracket_type !== 'main' && b.name !== 'Puestos 3-4')
        .sort((a, b) => (a.consolation_level || 0) - (b.consolation_level || 0));

    const renderTournamentContent = () => {
        if (loading) {
            return (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando...</p>
                </div>
            );
        }

        if (activeTab === 'info') {
            return renderInfo();
        }

        if (brackets.length === 0 && groups.length === 0) {
            return (
                <div className="no-brackets">
                    <span className="icon">📊</span>
                    <p>No hay cuadros ni grupos generados para esta categoría</p>
                </div>
            );
        }

        return (
            <div className="brackets-container">
                {groups.length > 0 && (
                    <div className="bracket-section">
                        <h2>🏆 Fase de Grupos</h2>
                        {renderGroups()}
                    </div>
                )}

                {brackets.length > 0 && (
                    <>
                        <div className="main-bracket-area">
                            {mainBracket && (
                                <div className="bracket-section main">
                                    <h2>🏆 Cuadro Principal</h2>
                                    {renderBracket(mainBracket)}
                                </div>
                            )}
                            {thirdPlaceBracket && thirdPlaceBracket.tournament_matches?.[0] && (
                                <div className="match-slot-3rd-place">
                                    {renderMatch(thirdPlaceBracket.tournament_matches[0], thirdPlaceBracket)}
                                </div>
                            )}
                        </div>

                        {consolationBrackets.map(bracket => (
                            <div key={bracket.id} className="bracket-section consolation">
                                <h2>🥈 {bracket.name}</h2>
                                {renderBracket(bracket)}
                            </div>
                        ))}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="bracket-view-page">
            <div className="category-tabs-scrollable">
                {onBack && (
                    <button className="btn-back" onClick={onBack}>
                        ← Volver
                    </button>
                )}
                <div className="category-tabs">
                    <button
                        className={`category-tab info-tab ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        ℹ️ Info
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-tab ${activeTab === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat.id)}
                        >
                            <span className="type-icon">{getCategoryTypeIcon(cat.type)}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>
                {activeTab !== 'info' && (
                    <label className="detailed-score-toggle">
                        <input
                            type="checkbox"
                            checked={showDetailedScore}
                            onChange={(e) => setShowDetailedScore(e.target.checked)}
                        />
                        <span className="toggle-label">Sets</span>
                    </label>
                )}
                {!isPublicView && tournament?.public_slug && (
                    <a
                        href={`/torneo/${tournament.public_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="public-link-btn"
                    >
                        🔗 Pública
                    </a>
                )}
            </div>

            {renderTournamentContent()}

            {showScoreModal && selectedMatch && (
                <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
                    <div className="score-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Introducir Resultado</h3>
                            <button className="close-btn" onClick={() => setShowScoreModal(false)}>✕</button>
                        </div>

                        <div className="match-players">
                            <div className="player-retirement-group">
                                <div className="player-label p1">
                                    {getPlayerName(selectedMatch.player1)}
                                </div>
                                <button className="btn-retire" onClick={() => handleRetirement(1)} title="Marcar como retirado (W.O.)">
                                    🏳️ Retirar
                                </button>
                            </div>
                            <span className="vs">VS</span>
                            <div className="player-retirement-group">
                                <button className="btn-retire" onClick={() => handleRetirement(2)} title="Marcar como retirado (W.O.)">
                                    Retirar 🏳️
                                </button>
                                <div className="player-label p2">
                                    {getPlayerName(selectedMatch.player2)}
                                </div>
                            </div>
                        </div>

                        <div className="score-inputs">
                            <div className="sets-header">
                                {Array.from({ length: matchFormat }, (_, i) => (
                                    <span key={i} className="set-header">Set {i + 1}</span>
                                ))}
                            </div>

                            <div className="player-scores p1">
                                <span className="player-name">{getPlayerName(selectedMatch.player1)}</span>
                                <div className="sets">
                                    {scoreInput.map((set, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={set.p1}
                                            onChange={(e) => handleScoreChange(i, 'p1', e.target.value)}
                                            className={set.p1 !== '' && set.p2 !== '' && set.p1 > set.p2 ? 'winning' : ''}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="player-scores p2">
                                <span className="player-name">{getPlayerName(selectedMatch.player2)}</span>
                                <div className="sets">
                                    {scoreInput.map((set, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={set.p2}
                                            onChange={(e) => handleScoreChange(i, 'p2', e.target.value)}
                                            className={set.p1 !== '' && set.p2 !== '' && set.p2 > set.p1 ? 'winning' : ''}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="winner-preview">
                            {getWinnerFromScore() ? (
                                <span className="winner-text">
                                    🏆 Ganador: {getWinnerFromScore() === selectedMatch.player1_id
                                        ? getPlayerName(selectedMatch.player1)
                                        : getPlayerName(selectedMatch.player2)
                                    }
                                </span>
                            ) : (
                                <span className="incomplete-text">
                                    ℹ️ Se necesitan {setsToWin} sets para ganar
                                </span>
                            )}
                        </div>

                        <div className="modal-actions">
                            {selectedMatch.status === 'completed' && (
                                <button className="btn-outline-danger" style={{ marginRight: 'auto', padding: '0.5rem 1rem' }} onClick={handleClearResult}>
                                    🗑️ Borrar Resultado
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => setShowScoreModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmitScore}
                                disabled={!getWinnerFromScore()}
                            >
                                ✓ Guardar Resultado
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentBracketView;

