import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/AuditService';
import { resetPaymentStatus } from '../services/MemberService';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

import { getConfig, saveConfig } from '../services/ConfigService';
import ConfirmDialog from '../components/ConfirmDialog';

const Admin = () => {
    const [logs, setLogs] = useState([]);
    const [config, setConfig] = useState(getConfig());
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('config'); // config, payments, audit
    const [selectedLog, setSelectedLog] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        confirmText: 'Confirmar'
    });

    useEffect(() => {
        setLogs(getAuditLogs());
    }, []);

    const handleResetPayments = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reiniciar Pagos',
            message: '¿Estás seguro de que quieres marcar a TODOS los socios como pendientes de pago? Esta acción no se puede deshacer.',
            confirmText: 'Reiniciar Pagos',
            isDestructive: true,
            onConfirm: () => {
                resetPaymentStatus(user);
                setLogs(getAuditLogs()); // Refresh logs
                alert('Se han marcado todos los socios como pendientes de pago.');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        const newConfig = { ...config, [name]: value };
        setConfig(newConfig);
        saveConfig(newConfig);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newConfig = { ...config, appLogo: reader.result };
                setConfig(newConfig);
                saveConfig(newConfig);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-page container">
            <div className="page-header">
                <div>
                    <h1>Administración</h1>
                    <p>Panel de control del club</p>
                </div>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab ${activeSection === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveSection('config')}
                >
                    Personalización
                </button>
                <button
                    className={`tab ${activeSection === 'payments' ? 'active' : ''}`}
                    onClick={() => setActiveSection('payments')}
                >
                    Gestión de Pagos
                </button>
                <button
                    className={`tab ${activeSection === 'comm' ? 'active' : ''}`}
                    onClick={() => setActiveSection('comm')}
                >
                    Comunicaciones
                </button>
                <button
                    className={`tab ${activeSection === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveSection('audit')}
                >
                    Histórico
                </button>
            </div>

            <div className="admin-content">
                {activeSection === 'config' && (
                    <div className="config-section card">
                        <h3>Personalización del Club</h3>
                        <div className="form-group">
                            <label>Título de la Aplicación</label>
                            <input
                                type="text"
                                name="appTitle"
                                value={config.appTitle}
                                onChange={handleConfigChange}
                                placeholder="Nombre del Club"
                            />
                        </div>
                        <div className="form-group">
                            <label>Logo del Club</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                            {config.appLogo && (
                                <div className="logo-preview">
                                    <img src={config.appLogo} alt="Logo preview" />
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                            const newConfig = { ...config, appLogo: null };
                                            setConfig(newConfig);
                                            saveConfig(newConfig);
                                        }}
                                    >
                                        Eliminar Logo
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group color-group">
                            <label>Colores de Marca</label>
                            <div className="color-pickers-row">
                                <div className="color-picker-item">
                                    <label>Primario</label>
                                    <input
                                        type="color"
                                        name="primaryColor"
                                        value={config.primaryColor || '#931c1f'}
                                        onChange={handleConfigChange}
                                    />
                                </div>
                                <div className="color-picker-item">
                                    <label>Acento</label>
                                    <input
                                        type="color"
                                        name="accentColor"
                                        value={config.accentColor || '#fbbf24'}
                                        onChange={handleConfigChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'payments' && (
                    <div className="payments-section card">
                        <h3>Gestión de Pagos</h3>
                        <p className="mb-4">Herramientas para la gestión masiva de estados de pago.</p>
                        <button className="btn btn-primary btn-danger-action" onClick={handleResetPayments}>
                            ⚠️ Reiniciar Pagos de Todos los Socios
                        </button>
                    </div>
                )}

                {activeSection === 'comm' && (
                    <div className="comm-section card">
                        <h3>Plantilla de Correo Electrónico</h3>
                        <p className="mb-4">Edita el correo que se enviará a los socios.</p>

                        <div className="form-group">
                            <label>Asunto</label>
                            <input
                                type="text"
                                name="emailSubject"
                                value={config.emailSubject || ''}
                                onChange={handleConfigChange}
                                placeholder="Asunto del correo"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cuerpo del Mensaje</label>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Usa <code>{`{{nombre}}`}</code> para insertar el nombre del socio automáticamente.</p>
                            <textarea
                                name="emailBody"
                                value={config.emailBody || ''}
                                onChange={handleConfigChange}
                                rows={15}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'audit' && (
                    <div className="audit-section card">
                        <h3>Histórico de Actividad</h3>
                        <div className="audit-list">
                            {logs.length > 0 ? (
                                logs.map(log => (
                                    <div key={log.id} className="audit-item clickable" onClick={() => setSelectedLog(log)}>
                                        <span className="audit-time">
                                            {new Date(log.timestamp).toLocaleString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        <span className="audit-user">{log.user}</span>
                                        <span className="audit-content-inline">
                                            <span className="audit-action">{log.action.replace(/_/g, ' ')}</span>
                                            <span className="audit-details">{log.details}</span>
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">No hay registros de actividad.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedLog && (
                <div className="admin-modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Detalle de Actividad</h3>
                        <div className="admin-modal-body">
                            <div className="detail-row">
                                <strong>Fecha:</strong>
                                <span>{new Date(selectedLog.timestamp).toLocaleString('es-ES')}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Usuario:</strong>
                                <span>{selectedLog.user}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Acción:</strong>
                                <span>{selectedLog.action}</span>
                            </div>
                            <div className="log-detail-box">
                                {selectedLog.details}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                isDestructive={confirmDialog.isDestructive}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default Admin;
