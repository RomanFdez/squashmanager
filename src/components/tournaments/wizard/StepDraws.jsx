import React, { useState, useEffect } from 'react';
import * as TournamentService from '../../../services/TournamentService';
import './StepDraws.css';

const StepDraws = ({ tournamentData, updateData, tournamentId }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [brackets, setBrackets] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    // Drag functionality temporarily disabled during refactor
    const [draggedPlayer, setDraggedPlayer] = useState(null);

    // Player swap functionality
    const [swapMode, setSwapMode] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const [drawConfig, setDrawConfig] = useState({
        format: 'monrad', // 'monrad' or 'groups'
        playersPerGroup: 4,
        advanceToMain: 2
    });

    useEffect(() => {
        if (selectedCategory) {
            setDrawConfig({
                format: selectedCategory.has_group_phase ? 'groups' : 'monrad',
                playersPerGroup: selectedCategory.players_per_group || 4,
                advanceToMain: selectedCategory.advance_to_main || 2
            });
            loadBrackets(selectedCategory.id);
        }
    }, [selectedCategory]);

    const loadBrackets = async (categoryId) => {
        try {
            setLoading(true);

            // Try fetching brackets
            const bracketsData = await TournamentService.getBrackets(categoryId);
            setBrackets(bracketsData || []);

            // Try fetching groups
            const groupsData = await TournamentService.getGroups(categoryId);
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setBrackets([]);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSwapPlayers = async () => {
        if (selectedPlayers.length !== 2) return;

        const [player1, player2] = selectedPlayers;

        // Check if both players are from the same type (both bracket or both group)
        if (player1.type !== player2.type) {
            alert('Solo puedes intercambiar jugadores del mismo tipo (ambos de cuadros o ambos de grupos)');
            return;
        }

        try {
            if (player1.type === 'bracket') {
                // Swap players in bracket matches
                await TournamentService.swapPlayersInBracket(
                    player1.matchId,
                    player1.slot,
                    player2.matchId,
                    player2.slot
                );
            } else if (player1.type === 'group') {
                // Check that both players are in the same group
                if (player1.groupId !== player2.groupId) {
                    alert('Los jugadores deben estar en el mismo grupo para poder intercambiarlos');
                    return;
                }

                // Swap players in groups
                await TournamentService.swapPlayersInGroup(
                    player1.groupId,
                    player1.playerId,
                    player2.playerId
                );
            }

            // Reload data
            await loadBrackets(selectedCategory.id);

            // Exit swap mode
            setSwapMode(false);
            setSelectedPlayers([]);
        } catch (error) {
            console.error('Error swapping players:', error);
            alert('Error al intercambiar jugadores: ' + error.message);
        }
    };

    const handlePlayerClick = (playerInfo) => {
        if (!swapMode) return;

        // Check if this player is already selected
        const isAlreadySelected = selectedPlayers.some(p =>
            p.type === playerInfo.type &&
            (p.matchId === playerInfo.matchId && p.slot === playerInfo.slot) ||
            (p.groupId === playerInfo.groupId && p.playerId === playerInfo.playerId)
        );

        if (isAlreadySelected) {
            // Deselect
            setSelectedPlayers(prev => prev.filter(p =>
                !(p.type === playerInfo.type &&
                    ((p.matchId === playerInfo.matchId && p.slot === playerInfo.slot) ||
                        (p.groupId === playerInfo.groupId && p.playerId === playerInfo.playerId)))
            ));
        } else {
            // Select (max 2)
            if (selectedPlayers.length < 2) {
                setSelectedPlayers(prev => [...prev, playerInfo]);
            } else {
                // Replace the first one
                setSelectedPlayers([selectedPlayers[1], playerInfo]);
            }
        }
    };

    const isPlayerSelected = (playerInfo) => {
        return selectedPlayers.some(p =>
            p.type === playerInfo.type &&
            ((p.matchId === playerInfo.matchId && p.slot === playerInfo.slot) ||
                (p.groupId === playerInfo.groupId && p.playerId === playerInfo.playerId))
        );
    };

    const handleGenerateDraw = async () => {
        if (!selectedCategory) return;
        const registrations = selectedCategory.tournament_registrations || [];

        if (registrations.length < 2) {
            alert('Se necesitan al menos 2 jugadores para generar un cuadro');
            return;
        }

        if (brackets.length > 0 || groups.length > 0) {
            if (!window.confirm('Ya existe un cuadro/grupos generados. ¿Regenerar y perder los datos actuales?')) {
                return;
            }
        }

        try {
            setGenerating(true);
            await TournamentService.generateDraw(selectedCategory.id, registrations, drawConfig);
            await loadBrackets(selectedCategory.id);
            if (updateData) {
                // Trigger parent update if needed
            }
        } catch (error) {
            console.error('Error generating draw:', error);
            alert('Error al generar el cuadro: ' + error.message);
        } finally {
            setGenerating(false);
        }
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
                                .map((p, idx) => {
                                    const playerInfo = {
                                        type: 'group',
                                        groupId: group.id,
                                        playerId: p.registration_id,
                                        name: getPlayerName(p.registration),
                                        seed: p.registration?.seed
                                    };
                                    const isSelected = isPlayerSelected(playerInfo);

                                    return (
                                        <tr
                                            key={p.id}
                                            className={`${swapMode ? 'swappable' : ''} ${isSelected ? 'selected-player' : ''} ${p.registration?.seed ? 'seed-player' : ''}`}
                                            onClick={() => {
                                                if (swapMode && p.registration?.seed) {
                                                    alert('No se pueden intercambiar cabezas de serie');
                                                    return;
                                                }
                                                handlePlayerClick(playerInfo);
                                            }}
                                            style={{ cursor: swapMode ? (p.registration?.seed ? 'not-allowed' : 'pointer') : 'default' }}
                                        >
                                            <td>{idx + 1}</td>
                                            <td>
                                                {getPlayerName(p.registration)}
                                                {p.registration?.seed && (
                                                    <span className="seed-badge">#{p.registration.seed}</span>
                                                )}
                                            </td>
                                            <td className="center">{p.points}</td>
                                            <td className="center">{p.games_won + p.games_lost}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    <div className="group-matches-preview">
                        <h5 className="mini-header">Partidos</h5>
                        <div className="mini-matches-list">
                            {group.tournament_group_matches?.map(m => {
                                const p1 = group.tournament_group_players.find(p => p.registration_id === m.player1_id)?.registration;
                                const p2 = group.tournament_group_players.find(p => p.registration_id === m.player2_id)?.registration;
                                return (
                                    <div key={m.id} className="mini-match-row">
                                        <span>
                                            {getPlayerName(p1)}
                                            {p1?.seed && <span className="seed-badge">#{p1.seed}</span>}
                                        </span>
                                        <span className="vs">vs</span>
                                        <span>
                                            {getPlayerName(p2)}
                                            {p2?.seed && <span className="seed-badge">#{p2.seed}</span>}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderMatch = (match, bracket) => {
        const p1Name = getPlayerName(match.player1);
        const p2Name = getPlayerName(match.player2);

        const player1Info = {
            type: 'bracket',
            matchId: match.id,
            slot: 'player1',
            playerId: match.player1_id,
            name: p1Name,
            seed: match.player1?.seed
        };

        const player2Info = {
            type: 'bracket',
            matchId: match.id,
            slot: 'player2',
            playerId: match.player2_id,
            name: p2Name,
            seed: match.player2?.seed
        };

        const isP1Selected = isPlayerSelected(player1Info);
        const isP2Selected = isPlayerSelected(player2Info);

        // Simulating the classification label logic from BracketView
        let classifLabel = '';
        if (bracket.name === 'Puestos 3-4' && match.position === 1) {
            classifLabel = '3º Y 4º PUESTO';
        } else if (bracket.bracket_type === 'main' && match.round === 1 && match.position === 1) {
            classifLabel = 'FINAL';
        }

        return (
            <div className="match-card bracket-match">
                <div
                    className={`player-slot ${match.winner_id === match.player1_id ? 'winner' : ''} ${!match.player1_id ? 'bye' : ''} ${swapMode && match.player1_id && !match.player1?.seed ? 'swappable' : ''} ${isP1Selected ? 'selected-player' : ''} ${match.player1?.seed ? 'seed-player' : ''}`}
                    onClick={() => {
                        if (!match.player1_id) return;
                        if (swapMode && match.player1?.seed) {
                            alert('No se pueden intercambiar cabezas de serie');
                            return;
                        }
                        handlePlayerClick(player1Info);
                    }}
                    style={{ cursor: swapMode && match.player1_id ? (match.player1?.seed ? 'not-allowed' : 'pointer') : 'default' }}
                >
                    <span className="player-name">
                        {p1Name}
                        {match.player1?.seed && <span className="seed-badge">#{match.player1.seed}</span>}
                    </span>
                </div>
                <div
                    className={`player-slot ${match.winner_id === match.player2_id ? 'winner' : ''} ${!match.player2_id ? 'bye' : ''} ${swapMode && match.player2_id && !match.player2?.seed ? 'swappable' : ''} ${isP2Selected ? 'selected-player' : ''} ${match.player2?.seed ? 'seed-player' : ''}`}
                    onClick={() => {
                        if (!match.player2_id) return;
                        if (swapMode && match.player2?.seed) {
                            alert('No se pueden intercambiar cabezas de serie');
                            return;
                        }
                        handlePlayerClick(player2Info);
                    }}
                    style={{ cursor: swapMode && match.player2_id ? (match.player2?.seed ? 'not-allowed' : 'pointer') : 'default' }}
                >
                    <span className="player-name">
                        {p2Name}
                        {match.player2?.seed && <span className="seed-badge">#{match.player2.seed}</span>}
                    </span>
                </div>
                {classifLabel && <div className="classification-label">{classifLabel}</div>}
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
            <div className="bracket-view">
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

    const registrations = selectedCategory?.tournament_registrations || [];
    const mainBracket = brackets.find(b => b.bracket_type === 'main');
    const consolationBrackets = brackets.filter(b => b.bracket_type !== 'main').sort((a, b) => (a.consolation_level || 0) - (b.consolation_level || 0));

    return (
        <div className="step-draws">
            <div className="step-header">
                <h3>Generación de Cuadros y Grupos</h3>
                <p>Configura y genera los cuadros o fases de grupos para cada categoría.</p>
            </div>

            {tournamentData.categories.length === 0 ? (
                <div className="no-data-warning">No hay categorías configuradas.</div>
            ) : (
                <div className="draws-container">
                    <div className="category-tabs">
                        {tournamentData.categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-tab ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {getCategoryTypeIcon(cat.type)} {cat.name}
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="draw-panel">
                            {/* NEW CONFIG BAR */}
                            <div className="draw-config-bar">
                                <div className="config-group">
                                    <label>Tipo de Cuadro:</label>
                                    <select
                                        value={drawConfig.format}
                                        onChange={(e) => setDrawConfig({ ...drawConfig, format: e.target.value })}
                                        disabled={generating}
                                    >
                                        <option value="monrad">Eliminatoria (Monrad)</option>
                                        <option value="groups">Liguilla (Fase de Grupos)</option>
                                    </select>
                                </div>
                                {drawConfig.format === 'groups' && (
                                    <>
                                        <div className="config-group">
                                            <label>Máx. por Grupo:</label>
                                            <input
                                                type="number"
                                                min="3"
                                                max="10"
                                                value={drawConfig.playersPerGroup}
                                                onChange={(e) => setDrawConfig({ ...drawConfig, playersPerGroup: parseInt(e.target.value) })}
                                                disabled={generating}
                                            />
                                        </div>
                                        <div className="config-group">
                                            <label>Clasifican:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={drawConfig.playersPerGroup - 1}
                                                value={drawConfig.advanceToMain}
                                                onChange={(e) => setDrawConfig({ ...drawConfig, advanceToMain: parseInt(e.target.value) })}
                                                disabled={generating}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {swapMode && (
                                <div className="swap-info-banner">
                                    {selectedPlayers.length === 0 && '🔄 Modo intercambio activado: Selecciona 2 jugadores para intercambiar sus posiciones'}
                                    {selectedPlayers.length === 1 && `✓ 1 jugador seleccionado (${selectedPlayers[0].name}). Selecciona un segundo jugador...`}
                                    {selectedPlayers.length === 2 && `✓ 2 jugadores seleccionados (${selectedPlayers[0].name} ↔ ${selectedPlayers[1].name}). Confirma el intercambio.`}
                                </div>
                            )}

                            <div className="draw-info-bar">
                                <div className="info-item">
                                    <span className="label">Jugadores:</span>
                                    <span className="value">{registrations.length}</span>
                                </div>

                                {(brackets.length > 0 || groups.length > 0) && (
                                    <>
                                        <button
                                            className={`btn-secondary ${swapMode ? 'active' : ''}`}
                                            onClick={() => {
                                                setSwapMode(!swapMode);
                                                setSelectedPlayers([]);
                                            }}
                                        >
                                            {swapMode ? '✖ Cancelar' : '🔄 Intercambiar Jugadores'}
                                        </button>

                                        {swapMode && selectedPlayers.length === 2 && (
                                            <button
                                                className="btn-primary"
                                                onClick={handleSwapPlayers}
                                            >
                                                ✓ Confirmar Intercambio
                                            </button>
                                        )}
                                    </>
                                )}

                                <button
                                    className="btn-primary generate-btn"
                                    onClick={handleGenerateDraw}
                                    disabled={registrations.length < 2 || generating || swapMode}
                                >
                                    {generating ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            Generando...
                                        </>
                                    ) : (
                                        '⚡ Generar'
                                    )}
                                </button>
                            </div>

                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Cargando información...</p>
                                </div>
                            ) : groups.length > 0 ? (
                                renderGroups()
                            ) : brackets.length === 0 ? (
                                <div className="no-bracket">
                                    <span className="icon">📊</span>
                                    <h4>Sin cuadro generado</h4>
                                    <p>
                                        {registrations.length < 2
                                            ? 'Necesitas al menos 2 jugadores inscritos'
                                            : 'Pulsa "Generar" para crear los enfrentamientos'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="brackets-display">
                                    {mainBracket && (
                                        <div className="bracket-section">
                                            <h4 className="bracket-title">🏆 {mainBracket.name}</h4>
                                            {renderBracket(mainBracket)}
                                        </div>
                                    )}

                                    {consolationBrackets.length > 0 && (
                                        <div className="consolation-brackets">
                                            <h4>Cuadros de Consolación</h4>
                                            {consolationBrackets.map(bracket => (
                                                <div key={bracket.id} className="bracket-section consolation">
                                                    <h5 className="bracket-title">🥈 {bracket.name}</h5>
                                                    {renderBracket(bracket)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StepDraws;
