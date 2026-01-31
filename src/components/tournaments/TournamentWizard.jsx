import React, { useState, useEffect, useRef } from 'react';
import StepInfo from './wizard/StepInfo';
import StepLogos from './wizard/StepLogos';
import StepCategories from './wizard/StepCategories';
import StepPlayers from './wizard/StepPlayers';
import StepDraws from './wizard/StepDraws';
import * as TournamentService from '../../services/TournamentService';
import './TournamentWizard.css';

const STEPS = [
    { id: 1, name: 'Información', icon: '📋' },
    { id: 2, name: 'Logos', icon: '🖼️' },
    { id: 3, name: 'Categorías', icon: '🏷️' },
    { id: 4, name: 'Jugadores', icon: '👥' },
    { id: 5, name: 'Cuadros', icon: '📊' }
];

const TournamentWizard = ({ tournament, onComplete, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const contentRef = useRef(null);
    const lastScrollTop = useRef(0);

    const [tournamentData, setTournamentData] = useState({
        id: null,
        name: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        location: '',
        price: 0,
        payment_types: ['efectivo'],
        match_format: 'best_of_3',
        status: 'draft',
        is_public: false,
        courts: [],
        categories: [],
        images: []
    });

    useEffect(() => {
        if (tournament) {
            setTournamentData({
                id: tournament.id,
                name: tournament.name || '',
                start_date: tournament.start_date || '',
                end_date: tournament.end_date || '',
                registration_deadline: tournament.registration_deadline || '',
                location: tournament.location || '',
                price: tournament.price || 0,
                payment_types: tournament.payment_types || ['efectivo'],
                match_format: tournament.match_format || 'best_of_3',
                status: tournament.status || 'draft',
                is_public: tournament.is_public || false,
                courts: tournament.tournament_courts || [],
                categories: tournament.tournament_categories || [],
                images: tournament.tournament_images || []
            });
        }
    }, [tournament]);

    // Prevent body scroll when wizard is open (especially useful for fixed mobile view)
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Handle step change scroll and reset nav visibility
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (contentRef.current) {
            contentRef.current.scrollTo(0, 0);
        }
        setIsNavVisible(true);
    }, [currentStep]);

    // Smart Navigation Logic
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

            // If content is small, always show
            if (scrollHeight <= clientHeight + 30) {
                if (!isNavVisible) setIsNavVisible(true);
                return;
            }

            const isAtBottom = scrollHeight - scrollTop <= clientHeight + 80;
            const isAtTop = scrollTop < 30;
            const isScrollingUp = scrollTop < lastScrollTop.current;

            if (isAtBottom || isAtTop || isScrollingUp) {
                setIsNavVisible(true);
            } else {
                setIsNavVisible(false);
            }

            lastScrollTop.current = scrollTop;
        };

        const currentContent = contentRef.current;
        if (currentContent) {
            currentContent.addEventListener('scroll', handleScroll);
            return () => currentContent.removeEventListener('scroll', handleScroll);
        }
    }, [currentStep, tournamentData.name, tournamentData.courts.length, tournamentData.categories.length]);

    const updateData = (field, value) => {
        setTournamentData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const saveDraft = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                name: tournamentData.name,
                start_date: tournamentData.start_date,
                end_date: tournamentData.end_date,
                registration_deadline: tournamentData.registration_deadline,
                location: tournamentData.location,
                price: parseFloat(tournamentData.price) || 0,
                payment_types: tournamentData.payment_types,
                match_format: tournamentData.match_format,
                status: tournamentData.status,
                is_public: tournamentData.is_public
            };

            if (tournamentData.id) {
                // Update existing
                await TournamentService.updateTournament(tournamentData.id, dataToSave);
            } else {
                // Create new
                const created = await TournamentService.createTournament(dataToSave);
                setTournamentData(prev => ({ ...prev, id: created.id }));
            }
            return true;
        } catch (error) {
            console.error('Error saving tournament:', error);
            alert('Error al guardar el torneo');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        // Validate current step
        if (!validateStep(currentStep)) return;

        // Save draft on first step
        if (currentStep === 1) {
            const saved = await saveDraft();
            if (!saved) return;
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step - complete wizard
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            onCancel();
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!tournamentData.name.trim()) {
                    alert('Por favor, introduce el nombre del torneo');
                    return false;
                }
                if (!tournamentData.start_date || !tournamentData.end_date) {
                    alert('Por favor, selecciona las fechas del torneo');
                    return false;
                }
                return true;
            case 3:
                // Categories validation is optional - user can come back later
                return true;
            default:
                return true;
        }
    };

    const goToStep = async (stepId) => {
        if (stepId === currentStep) return;

        // If moving forward from step 1 and we don't have an ID yet, we MUST save
        if (currentStep === 1 && stepId > 1 && !tournamentData.id) {
            if (!validateStep(1)) return;
            const saved = await saveDraft();
            if (!saved) return;
        }

        setCurrentStep(stepId);
    };

    const renderStepContent = () => {
        const commonProps = {
            tournamentData,
            updateData,
            tournamentId: tournamentData.id
        };

        switch (currentStep) {
            case 1:
                return <StepInfo {...commonProps} />;
            case 2:
                return <StepLogos {...commonProps} />;
            case 3:
                return <StepCategories {...commonProps} />;
            case 4:
                return <StepPlayers {...commonProps} />;
            case 5:
                return <StepDraws {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="tournament-wizard">
            <div className="wizard-header">
                <h2>{tournament ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
                <button className="btn-close" onClick={onCancel}>✕</button>
            </div>

            {/* Step Indicator */}
            <div className="wizard-steps">
                {STEPS.map((step, index) => (
                    <div
                        key={step.id}
                        className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                        onClick={() => goToStep(step.id)}
                    >
                        <div className="step-circle">
                            {currentStep > step.id ? '✓' : step.icon}
                        </div>
                        <span className="step-name">{step.name}</span>
                        {index < STEPS.length - 1 && <div className="step-connector" />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="wizard-content" ref={contentRef}>
                {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className={`wizard-navigation ${!isNavVisible ? 'nav-hidden' : ''}`}>
                <button
                    className="btn btn-secondary"
                    onClick={handleBack}
                    disabled={saving}
                >
                    {currentStep === 1 ? 'Cancelar' : '← Anterior'}
                </button>

                <div className="nav-center">
                    <span className="step-counter">
                        Paso {currentStep} de {STEPS.length}
                    </span>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="spinner-small"></span>
                            Guardando...
                        </>
                    ) : currentStep === STEPS.length ? (
                        '✓ Finalizar'
                    ) : (
                        'Siguiente →'
                    )}
                </button>
            </div>
        </div>
    );
};

export default TournamentWizard;
