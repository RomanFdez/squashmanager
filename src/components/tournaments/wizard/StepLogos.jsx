import React, { useState, useEffect } from 'react';
import * as TournamentService from '../../../services/TournamentService';
import './StepLogos.css';

const StepLogos = ({ tournamentData, updateData, tournamentId }) => {
    const [clubImages, setClubImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const slots = [
        { number: 1, label: 'Cartel del Torneo', type: 'poster' },
        { number: 2, label: 'Logo del Club', type: 'club_logo' },
        { number: 3, label: 'Sponsor 1', type: 'sponsor' },
        { number: 4, label: 'Sponsor 2', type: 'sponsor' },
        { number: 5, label: 'Sponsor 3', type: 'sponsor' },
        { number: 6, label: 'Sponsor 4', type: 'sponsor' },
        { number: 7, label: 'Sponsor 5', type: 'sponsor' },
        { number: 8, label: 'Sponsor 6', type: 'sponsor' },
        { number: 9, label: 'Sponsor 7', type: 'sponsor' },
        { number: 10, label: 'Sponsor 8', type: 'sponsor' },
        { number: 11, label: 'Sponsor 9', type: 'sponsor' },
        { number: 12, label: 'Sponsor 10', type: 'sponsor' }
    ];

    useEffect(() => {
        loadClubImages();
    }, []);

    const loadClubImages = async () => {
        try {
            setLoading(true);
            const images = await TournamentService.getClubImages();
            setClubImages(images);
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageForSlot = (slotNumber) => {
        const assignment = tournamentData.images?.find(img => img.slot_number === slotNumber);
        if (assignment?.club_image) {
            return assignment.club_image;
        }
        return null;
    };

    const handleSlotClick = (slotNumber) => {
        setSelectedSlot(slotNumber);
    };

    const handleImageSelect = async (clubImage) => {
        if (!selectedSlot) return;

        // If tournament not saved yet, store locally
        if (!tournamentId) {
            const newImages = (tournamentData.images || []).filter(img => img.slot_number !== selectedSlot);
            newImages.push({
                slot_number: selectedSlot,
                club_image_id: clubImage.id,
                club_image: clubImage
            });
            updateData('images', newImages);
            setSelectedSlot(null);
            return;
        }

        try {
            await TournamentService.assignImageToTournament(tournamentId, clubImage.id, selectedSlot);

            // Update local state
            const newImages = (tournamentData.images || []).filter(img => img.slot_number !== selectedSlot);
            newImages.push({
                slot_number: selectedSlot,
                club_image_id: clubImage.id,
                club_image: clubImage
            });
            updateData('images', newImages);
            setSelectedSlot(null);
        } catch (error) {
            console.error('Error assigning image:', error);
            alert('Error al asignar la imagen: ' + error.message);
        }
    };

    const handleRemoveImage = async (slotNumber) => {
        // Update local state first
        updateData('images', (tournamentData.images || []).filter(img => img.slot_number !== slotNumber));

        // If tournament exists in DB, remove from there too
        if (tournamentId) {
            try {
                await TournamentService.removeImageFromTournament(tournamentId, slotNumber);
            } catch (error) {
                console.error('Error removing image from DB:', error);
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset the input so the same file can be selected again
        e.target.value = '';

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede superar los 5MB');
            return;
        }

        try {
            setUploading(true);
            const slot = slots.find(s => s.number === selectedSlot);
            const uploadedImage = await TournamentService.uploadClubImage(file, slot?.type || 'general');

            // Add to club images list
            setClubImages(prev => [uploadedImage, ...prev]);

            // If we have a slot selected, assign it
            if (selectedSlot) {
                await handleImageSelect(uploadedImage);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen: ' + (error.message || 'Error desconocido'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="step-logos">
            <div className="logos-intro">
                <h3>🖼️ Imágenes del Torneo</h3>
                <p>Selecciona las imágenes que aparecerán en la página del torneo. Puedes subir nuevas o usar las ya existentes.</p>
            </div>

            {/* Slots Grid */}
            <div className="slots-container">
                <div className="slots-grid">
                    {slots.map(slot => {
                        const image = getImageForSlot(slot.number);
                        const isMainSlot = slot.number <= 2;

                        return (
                            <div
                                key={slot.number}
                                className={`image-slot ${isMainSlot ? 'main-slot' : ''} ${selectedSlot === slot.number ? 'selected' : ''} ${image ? 'has-image' : ''}`}
                                onClick={() => handleSlotClick(slot.number)}
                            >
                                {image ? (
                                    <>
                                        <img src={image.image_url} alt={slot.label} />
                                        <div className="slot-overlay">
                                            <button
                                                className="remove-image-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveImage(slot.number);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="slot-placeholder">
                                        <span className="slot-icon">
                                            {slot.number === 1 ? '🎨' : slot.number === 2 ? '🏛️' : '🤝'}
                                        </span>
                                        <span className="slot-label">{slot.label}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Image Picker Modal/Panel */}
            {selectedSlot && (
                <div className="image-picker-overlay" onClick={() => setSelectedSlot(null)}>
                    <div className="image-picker-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="picker-header">
                            <h4>Selecciona una imagen para: {slots.find(s => s.number === selectedSlot)?.label}</h4>
                            <button className="close-picker" onClick={() => setSelectedSlot(null)}>✕</button>
                        </div>

                        {/* Upload New */}
                        <div className="upload-section">
                            <label className="upload-btn" htmlFor="image-upload">
                                {uploading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        📤 Subir Nueva Imagen
                                    </>
                                )}
                            </label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                        </div>

                        {/* Existing Images */}
                        <div className="existing-images">
                            <h5>O selecciona de las existentes:</h5>
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                </div>
                            ) : clubImages.length === 0 ? (
                                <p className="no-images">No hay imágenes guardadas. Sube la primera.</p>
                            ) : (
                                <div className="images-grid">
                                    {clubImages.map(img => (
                                        <div
                                            key={img.id}
                                            className="selectable-image"
                                            onClick={() => handleImageSelect(img)}
                                        >
                                            <img src={img.image_url} alt={img.name || 'Imagen'} />
                                            {img.name && <span className="image-name">{img.name}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepLogos;
