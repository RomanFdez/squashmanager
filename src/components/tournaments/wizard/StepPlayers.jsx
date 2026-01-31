import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import * as TournamentService from '../../../services/TournamentService';
import './StepPlayers.css';

const StepPlayers = ({ tournamentData, updateData, tournamentId }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isExternalPlayer, setIsExternalPlayer] = useState(false);
    const [externalForm, setExternalForm] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, registration: null });
    const [seedModal, setSeedModal] = useState({ show: false, registration: null });
    const [seedValue, setSeedValue] = useState('');

    // Derive selectedCategory from tournamentData to always get fresh data
    const selectedCategory = tournamentData.categories.find(c => c.id === selectedCategoryId) || null;

    useEffect(() => {
        loadMembers();
        if (tournamentData.categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(tournamentData.categories[0].id);
        }
    }, [tournamentData.categories]);

    const loadMembers = async () => {
        try {
            setLoadingMembers(true);
            const { data, error } = await supabase
                .from('members')
                .select('id, name, email, phone')
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const loadCategoryRegistrations = async (categoryId) => {
        try {
            const registrations = await TournamentService.getRegistrations(categoryId);
            // Update the category in local state
            updateData('categories', tournamentData.categories.map(cat =>
                cat.id === categoryId ? { ...cat, tournament_registrations: registrations } : cat
            ));
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategoryId(category.id);
        setShowAddForm(false);
        setSearchTerm('');

        // Load registrations if not loaded
        if (!category.tournament_registrations) {
            loadCategoryRegistrations(category.id);
        }
    };


    const handleAddMember = async (member) => {
        if (!selectedCategory) return;

        // Check if already registered (local check)
        const registrations = selectedCategory.tournament_registrations || [];
        if (registrations.some(r => r.member_id === member.id)) {
            alert('Este socio ya está inscrito en esta categoría');
            return;
        }

        try {
            await TournamentService.registerMember(selectedCategory.id, member.id, {
                registration_name: member.name,
                registration_email: member.email,
                registration_phone: member.phone
            });

            await loadCategoryRegistrations(selectedCategory.id);
            setShowAddForm(false);
            setSearchTerm('');
        } catch (error) {
            console.error('Error registering member:', error);
            // Handle duplicate key error
            if (error.code === '23505') {
                alert('Este jugador ya está inscrito en esta categoría');
                // Reload registrations in case they changed
                await loadCategoryRegistrations(selectedCategory.id);
            } else {
                alert('Error al inscribir al jugador: ' + (error.message || 'Error desconocido'));
            }
        }
    };

    const handleAddExternal = async () => {
        if (!selectedCategory) return;

        if (!externalForm.name.trim()) {
            alert('Por favor, introduce el nombre del jugador');
            return;
        }

        try {
            await TournamentService.registerExternalPlayer(selectedCategory.id, externalForm);
            await loadCategoryRegistrations(selectedCategory.id);

            setExternalForm({ name: '', email: '', phone: '' });
            setShowAddForm(false);
            setIsExternalPlayer(false);
        } catch (error) {
            console.error('Error registering external player:', error);
            alert('Error al inscribir al jugador');
        }
    };

    const handleRemoveClick = (registration) => {
        setConfirmModal({ show: true, registration });
    };

    const handleConfirmRemove = async () => {
        const registration = confirmModal.registration;
        setConfirmModal({ show: false, registration: null });

        if (!registration) return;

        try {
            await TournamentService.removeRegistration(registration.id);
            await loadCategoryRegistrations(selectedCategoryId);
        } catch (error) {
            console.error('Error removing registration:', error);
            alert('Error al eliminar el jugador: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleCancelRemove = () => {
        setConfirmModal({ show: false, registration: null });
    };

    const getPlayerName = (registration) => {
        if (registration.member?.name) return registration.member.name;
        if (registration.external_player?.name) return registration.external_player.name;
        return registration.registration_name;
    };

    const getPlayerType = (registration) => {
        if (registration.member_id) return 'member';
        return 'external';
    };

    const handleOpenSeedModal = (registration) => {
        setSeedModal({ show: true, registration });
        setSeedValue(registration.seed || '');
    };

    const handleSetSeed = async () => {
        const registration = seedModal.registration;
        if (!registration) return;

        const seed = seedValue === '' ? null : parseInt(seedValue);

        // Validate seed number
        if (seed !== null && (isNaN(seed) || seed < 1 || seed > 32)) {
            alert('El seed debe ser un número entre 1 y 32');
            return;
        }

        // Check if seed is already used by another player
        if (seed !== null) {
            const existingSeed = registrations.find(
                r => r.id !== registration.id && r.seed === seed
            );
            if (existingSeed) {
                alert(`El seed #${seed} ya está asignado a ${getPlayerName(existingSeed)}`);
                return;
            }
        }

        try {
            await TournamentService.updateRegistration(registration.id, { seed });
            await loadCategoryRegistrations(selectedCategoryId);
            setSeedModal({ show: false, registration: null });
            setSeedValue('');
        } catch (error) {
            console.error('Error updating seed:', error);
            alert('Error al actualizar el seed: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleClearSeed = async () => {
        const registration = seedModal.registration;
        if (!registration) return;

        try {
            await TournamentService.updateRegistration(registration.id, { seed: null });
            await loadCategoryRegistrations(selectedCategoryId);
            setSeedModal({ show: false, registration: null });
            setSeedValue('');
        } catch (error) {
            console.error('Error clearing seed:', error);
            alert('Error al eliminar el seed');
        }
    };

    const handleCloseSeedModal = () => {
        setSeedModal({ show: false, registration: null });
        setSeedValue('');
    };

    const getCategoryTypeIcon = (type) => {
        const icons = { masculina: '♂️', femenina: '♀️', mixta: '⚥' };
        return icons[type] || '🎾';
    };

    const registrations = selectedCategory?.tournament_registrations || [];

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const isRegistered = registrations.some(r => r.member_id === m.id);
        return matchesSearch && !isRegistered;
    });

    return (
        <div className="step-players">
            <div className="players-intro">
                <h3>👥 Jugadores</h3>
                <p>Inscribe jugadores en cada categoría</p>
            </div>

            {tournamentData.categories.length === 0 ? (
                <div className="no-categories-warning">
                    <span className="icon">⚠️</span>
                    <p>Primero debes crear al menos una categoría en el paso anterior.</p>
                </div>
            ) : (
                <div className="players-container">
                    {/* Category Tabs */}
                    <div className="category-tabs">
                        {tournamentData.categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-tab ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(cat)}
                            >
                                {getCategoryTypeIcon(cat.type)} {cat.name}
                                <span className="player-count">
                                    {cat.tournament_registrations?.length || 0}
                                </span>
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="category-players-panel">
                            {/* Players List */}
                            <div className="players-list-section">
                                <div className="section-header">
                                    <h4>Jugadores Inscritos ({registrations.length})</h4>
                                    {selectedCategory.max_participants && (
                                        <span className="capacity-badge">
                                            {registrations.length} / {selectedCategory.max_participants}
                                        </span>
                                    )}
                                </div>

                                {registrations.length === 0 ? (
                                    <div className="empty-players">
                                        <p>No hay jugadores inscritos</p>
                                    </div>
                                ) : (
                                    <div className="players-list">
                                        {registrations.map((reg, index) => (
                                            <div key={reg.id} className="player-item">
                                                <span className="player-number">{index + 1}</span>
                                                <div className="player-info">
                                                    <span className="player-name">{getPlayerName(reg)}</span>
                                                    <span className={`player-type ${getPlayerType(reg)}`}>
                                                        {getPlayerType(reg) === 'member' ? 'Socio' : 'Externo'}
                                                    </span>
                                                </div>
                                                <button
                                                    className={`seed-btn ${reg.seed ? 'has-seed' : ''}`}
                                                    onClick={() => handleOpenSeedModal(reg)}
                                                    title={reg.seed ? `Seed #${reg.seed}` : 'Asignar seed'}
                                                >
                                                    {reg.seed ? `#${reg.seed}` : '🌱'}
                                                </button>
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => handleRemoveClick(reg)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Regular Add Button - visible on desktop */}
                                {!showAddForm && (
                                    <button className="add-player-btn" onClick={() => setShowAddForm(true)}>
                                        ➕ Añadir Jugador
                                    </button>
                                )}
                            </div>

                            {/* Floating Add Button - visible on mobile */}
                            {!showAddForm && (
                                <button className="add-player-fab" onClick={() => setShowAddForm(true)}>
                                    ➕
                                </button>
                            )}

                            {/* Add Player Form */}
                            {showAddForm && (
                                <div className="add-player-panel">
                                    <div className="panel-header">
                                        <h4>Añadir Jugador</h4>
                                        <button className="close-btn" onClick={() => {
                                            setShowAddForm(false);
                                            setIsExternalPlayer(false);
                                        }}>✕</button>
                                    </div>

                                    {/* Toggle Member/External */}
                                    <div className="player-type-toggle">
                                        <button
                                            className={`toggle-btn ${!isExternalPlayer ? 'active' : ''}`}
                                            onClick={() => setIsExternalPlayer(false)}
                                        >
                                            👤 Socio del Club
                                        </button>
                                        <button
                                            className={`toggle-btn ${isExternalPlayer ? 'active' : ''}`}
                                            onClick={() => setIsExternalPlayer(true)}
                                        >
                                            🆕 Jugador Externo
                                        </button>
                                    </div>

                                    {!isExternalPlayer ? (
                                        /* Member Search */
                                        <div className="member-search">
                                            <input
                                                type="text"
                                                placeholder="🔍 Buscar socio por nombre o email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />

                                            {loadingMembers ? (
                                                <div className="loading-state">
                                                    <div className="spinner"></div>
                                                </div>
                                            ) : (
                                                <div className="members-list">
                                                    {filteredMembers.length === 0 ? (
                                                        <p className="no-results">No se encontraron resultados</p>
                                                    ) : (
                                                        filteredMembers.slice(0, 10).map(member => {
                                                            const isRegistered = registrations.some(r => r.member_id === member.id);
                                                            return (
                                                                <div
                                                                    key={member.id}
                                                                    className={`member-item ${isRegistered ? 'registered' : ''}`}
                                                                    onClick={() => !isRegistered && handleAddMember(member)}
                                                                >
                                                                    <div className="member-info">
                                                                        <span className="member-name">{member.name}</span>
                                                                        {member.email && (
                                                                            <span className="member-email">{member.email}</span>
                                                                        )}
                                                                    </div>
                                                                    {isRegistered ? (
                                                                        <span className="registered-badge">✓ Inscrito</span>
                                                                    ) : (
                                                                        <span className="add-badge">+ Añadir</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* External Player Form */
                                        <div className="external-form">
                                            <div className="form-group">
                                                <label>Nombre y Apellidos *</label>
                                                <input
                                                    type="text"
                                                    value={externalForm.name}
                                                    onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })}
                                                    placeholder="Nombre completo"
                                                />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Email</label>
                                                    <input
                                                        type="email"
                                                        value={externalForm.email}
                                                        onChange={(e) => setExternalForm({ ...externalForm, email: e.target.value })}
                                                        placeholder="email@ejemplo.com"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Teléfono</label>
                                                    <input
                                                        type="tel"
                                                        value={externalForm.phone}
                                                        onChange={(e) => setExternalForm({ ...externalForm, phone: e.target.value })}
                                                        placeholder="600 000 000"
                                                    />
                                                </div>
                                            </div>
                                            <button className="btn-primary" onClick={handleAddExternal}>
                                                ➕ Añadir Jugador Externo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmModal.show && (
                <div className="confirm-modal-overlay" onClick={handleCancelRemove}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-icon">⚠️</div>
                        <h4>¿Eliminar jugador?</h4>
                        <p>
                            ¿Estás seguro de que quieres eliminar a <strong>{confirmModal.registration ? getPlayerName(confirmModal.registration) : ''}</strong> de esta categoría?
                        </p>
                        <div className="confirm-modal-actions">
                            <button className="btn btn-secondary" onClick={handleCancelRemove}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleConfirmRemove}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Seed Modal */}
            {seedModal.show && (
                <div className="confirm-modal-overlay" onClick={handleCloseSeedModal}>
                    <div className="confirm-modal seed-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-icon">🌱</div>
                        <h4>Cabeza de serie</h4>
                        <p>
                            Asigna un número de cabeza de serie para <strong>{seedModal.registration ? getPlayerName(seedModal.registration) : ''}</strong>
                        </p>
                        <div className="seed-input-group">
                            <input
                                type="number"
                                min="1"
                                max="32"
                                value={seedValue}
                                onChange={(e) => setSeedValue(e.target.value)}
                                placeholder="Ej: 1, 2, 3..."
                                className="seed-input"
                            />
                            <span className="seed-hint">Los cabezas de serie (1-4) se colocan automáticamente en el cuadro</span>
                        </div>
                        <div className="confirm-modal-actions">
                            <button className="btn btn-secondary" onClick={handleCloseSeedModal}>
                                Cancelar
                            </button>
                            {seedModal.registration?.seed && (
                                <button className="btn btn-danger" onClick={handleClearSeed}>
                                    Quitar
                                </button>
                            )}
                            <button className="btn btn-primary" onClick={handleSetSeed}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepPlayers;
