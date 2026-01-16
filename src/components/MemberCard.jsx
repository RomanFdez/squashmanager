import React from 'react';
import './MemberCard.css';

const MemberCard = ({ member, onEdit, canManage }) => {
    const {
        name,
        memberNumber,
        role,
        status,
        type,
        isPaid
    } = member;

    return (
        <div className={`member-card card ${status === 'inactive' ? 'inactive' : ''}`}>
            <div className="member-photo">
                {member.photo ? (
                    <img src={member.photo} alt={name} />
                ) : (
                    <div className="photo-placeholder">{name.charAt(0)}</div>
                )}
            </div>

            <div className="member-info">
                <div className="member-header">
                    <span className="member-number">#{memberNumber}</span>
                    <span className={`status-badge ${status}`}>{status === 'active' ? 'Activo' : 'Baja'}</span>
                </div>
                <h4 className="member-name">{name}</h4>
                <div className="member-details">
                    <span className="detail-item"><strong>Rol:</strong> {role}</span>
                    <span className="detail-item"><strong>Tipo:</strong> {type}</span>
                </div>
                {!isPaid && <div className="payment-warning">⚠️ Pago pendiente</div>}
            </div>

            {canManage && (
                <button className="edit-btn" onClick={() => onEdit(member)}>
                    ✏️
                </button>
            )}
        </div>
    );
};

export default MemberCard;
