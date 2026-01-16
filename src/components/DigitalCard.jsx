import React from 'react';
import './DigitalCard.css';
import { getConfig } from '../services/ConfigService';

const DigitalCard = ({ member }) => {
    const config = getConfig();
    const logoSrc = config.appLogo || '/favicon.png'; // Corrected property name
    const primaryColor = config.primaryColor || '#931c1f';
    const accentColor = config.accentColor || '#fbbf24';
    const clubName = config.appTitle || 'Squash Ciudad de Murcia';

    return (
        <div className="digital-card-container">
            <div className="digital-card" style={{ '--card-primary': primaryColor, '--card-accent': accentColor }}>
                <div className="card-header">
                    <img src={logoSrc} alt="Logo Club" className="card-logo" />
                    <div className="card-club-name">{clubName}</div>
                </div>
                <div className="card-body">
                    <div className="card-photo-wrapper">
                        {member.photo ? (
                            <img src={member.photo} alt={member.name} className="card-photo" />
                        ) : (
                            <div className="card-photo-placeholder">
                                {member.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="card-info">
                        <h3 className="card-member-name">{member.name}</h3>
                        <div className="card-detail-row">
                            <span className="card-label">Socio Nº</span>
                            <span className="card-value number">{member.memberNumber}</span>
                        </div>
                        <div className="card-detail-row">
                            <span className="card-label">DNI</span>
                            <span className="card-value">{member.dni || 'N/D'}</span>
                        </div>
                        <div className="card-detail-row">
                            <span className="card-label">Tipo</span>
                            <span className="card-value badge">{member.type === 'junior' ? 'JUNIOR' : 'ADULTO'}</span>
                        </div>
                        <div className="card-status-row">
                            <span className={`status-badge ${member.status}`}>
                                {member.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                            {member.status === 'active' && (
                                <span className={`payment-badge ${member.isPaid ? 'paid' : 'unpaid'}`}>
                                    {member.isPaid ? '2025 PAGADO' : 'PENDIENTE'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="card-footer">
                    Temporada 2025
                </div>
            </div>
        </div>
    );
};

export default DigitalCard;
