import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay">
            <div className="confirm-modal">
                <div className="confirm-header">
                    <h3>{title}</h3>
                </div>
                <div className="confirm-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDestructive ? 'btn-danger-action' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
