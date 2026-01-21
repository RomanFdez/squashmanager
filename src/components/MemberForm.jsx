import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validateDNI, validatePhone, validatePassword, formatDate } from '../utils/validators';
import { useAuth, ROLES } from '../context/AuthContext';
import { deleteMember, canDeactivateAdmin } from '../services/MemberService';
import { supabase } from '../lib/supabaseClient';
import './MemberForm.css';

import ConfirmDialog from './ConfirmDialog';

const MemberForm = ({ member, onSave, onDelete, onRemove, onCancel }) => {
    const { user, ROLES: AUTH_ROLES, isAdmin } = useAuth();
    // Helper to avoid name conflict if ROLES is used from context
    const ROLES_ENUM = AUTH_ROLES;

    const [formData, setFormData] = useState({
        name: '',
        dni: '',
        type: 'adulto', // adulto or junior
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        birthDate: '',
        joinDate: new Date().toISOString().split('T')[0],
        leaveDate: '',
        role: ROLES_ENUM.SOCIO,
        licenseRegional: false,
        licenseNational: false,
        isPaid: false,
        isSchoolEnrolled: false,
        guardianName: '',
        guardianDni: '',
        guardianPhone: '',
        guardianEmail: '',
        photo: null,
        status: 'active',
        ...member,
    });

    const [errors, setErrors] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        confirmText: 'Confirmar'
    });

    useEffect(() => {
        // Logic: National implies Regional
        if (formData.licenseNational && !formData.licenseRegional) {
            setFormData(prev => ({ ...prev, licenseRegional: true }));
        }
    }, [formData.licenseNational]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Logic for switching to Junior
            if (name === 'type' && value === 'junior') {
                newData.role = ROLES_ENUM.SOCIO;
                newData.password = '';
                newData.confirmPassword = '';
            }

            // Auto-fill email from guardianEmail if junior
            if (newData.type === 'junior' && name === 'guardianEmail') {
                newData.email = value;
            }

            return newData;
        });
    };

    // [Removed handleBlur]

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'El nombre es obligatorio';

        if (formData.type !== 'junior') {
            if (!validateDNI(formData.dni)) newErrors.dni = 'DNI/NIF no válido';
            if (!validatePhone(formData.phone)) newErrors.phone = 'Teléfono debe tener 9 dígitos';
            if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email no válido';
        }

        // [Removed password validation]

        // Junior validation
        if (formData.type === 'junior') {
            if (!formData.guardianName) newErrors.guardianName = 'Nombre del tutor obligatorio';
            if (!validateDNI(formData.guardianDni)) newErrors.guardianDni = 'DNI del tutor no válido';
            if (!validatePhone(formData.guardianPhone)) newErrors.guardianPhone = 'Teléfono del tutor no válido';
            if (formData.guardianEmail && !/^\S+@\S+\.\S+$/.test(formData.guardianEmail)) {
                newErrors.guardianEmail = 'Email del tutor no válido';
            }
            // Ensure main email is set (hidden field logic)
            if (!formData.email && formData.guardianEmail) {
                // Should have been set by handleChange but double check
                // We don't error here, just rely on guardianEmail
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setIsSaving(true);
            try {
                await onSave(formData);
            } catch (error) {
                console.error("Error saving member:", error);
                alert("Error al guardar el socio. Comprueba la consola para más detalles.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            alert('El archivo es demasiado grande. Máximo 1MB.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('member-photos').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeactivate = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // If inactive -> Reactivate
        if (member.status === 'inactive') {
            setConfirmDialog({
                isOpen: true,
                title: 'Reactivar Socio',
                message: `¿Quieres reactivar a ${formData.name}?`,
                confirmText: 'Reactivar',
                isDestructive: false,
                onConfirm: () => {
                    // Update status to active and call onSave to refresh list
                    onSave({ ...member, status: 'active' });
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            });
            return;
        }

        // If active -> Deactivate
        if (!canDeactivateAdmin(member.id)) {
            alert('No se puede dar de baja al último administrador (Presidente, Secretario o Tesorero).');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Dar de Baja',
            message: `¿Estás seguro de que quieres dar de baja a ${formData.name}?`,
            confirmText: 'Dar de Baja',
            isDestructive: true,
            onConfirm: () => {
                if (onDelete) {
                    onDelete(member.id);
                } else {
                    // Fallback
                    deleteMember(user, member.id);
                    onCancel();
                }
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleRemoveClick = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'ELIMINAR DEFINITIVAMENTE',
            message: `⚠ Esta acción borrará TODOS los datos de ${formData.name} y NO se puede deshacer. ¿Estás seguro?`,
            confirmText: 'ELIMINAR',
            isDestructive: true,
            onConfirm: () => {
                if (onRemove) onRemove(member.id);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <>
            <form className="member-form card" onSubmit={handleSubmit}>
                <div className="form-title-row">
                    <h3>{member?.id ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                    <div className="form-title-actions">
                        {member?.id && (
                            <>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${formData.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                    onClick={handleDeactivate}
                                >
                                    {formData.status === 'active' ? 'Dar de Baja' : 'Reactivar Socio'}
                                </button>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={handleRemoveClick}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Nombre y Apellidos*</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Categoría</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option value="adulto">Adulto</option>
                            <option value="junior">Junior</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Fecha de Nacimiento</label>
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate || ''}
                            onChange={handleChange}
                        />
                    </div>

                    {formData.type !== 'junior' && (
                        <>
                            <div className="form-group">
                                <label>DNI / NIF*</label>
                                <input
                                    type="text"
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    className={errors.dni ? 'error' : ''}
                                    placeholder="12345678Z"
                                />
                                {errors.dni && <span className="error-text">{errors.dni}</span>}
                            </div>

                            <div className="form-group">
                                <label>Teléfono*</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={errors.phone ? 'error' : ''}
                                />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>

                            <div className="form-group">
                                <label>Email*</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error' : ''}
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                        </>
                    )}

                    {formData.type !== 'junior' && (
                        <div className="form-group">
                            <label>Tipo de Socio / Cargo</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value={ROLES_ENUM.SOCIO}>Socio</option>
                                <option value={ROLES_ENUM.PRESIDENTE}>Presidente</option>
                                <option value={ROLES_ENUM.VICEPRESIDENTE}>Vicepresidente</option>
                                <option value={ROLES_ENUM.SECRETARIO}>Secretario</option>
                                <option value={ROLES_ENUM.TESORERO}>Tesorero</option>
                                <option value={ROLES_ENUM.VOCAL}>Vocal</option>
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Dirección Postal</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows="2" />
                    </div>

// [Removed password block]

                    <div className="form-group">
                        <label>Fecha de Alta</label>
                        <input
                            type="date"
                            name="joinDate"
                            value={formData.joinDate}
                            onChange={handleChange}
                            readOnly={!!member?.id}
                        />
                    </div>

                    <div className="form-group">
                        <label>Licencias</label>
                        <div className="checkbox-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="licenseRegional"
                                    checked={formData.licenseRegional}
                                    onChange={handleChange}
                                /> <span>Regional</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="licenseNational"
                                    checked={formData.licenseNational}
                                    onChange={handleChange}
                                /> <span>Nacional</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isPaid"
                                checked={formData.isPaid}
                                onChange={handleChange}
                            />
                            <span>Al corriente de pago</span>
                        </label>
                    </div>

                    {formData.type === 'junior' && (
                        <>
                            <div className="form-divider-row">
                                <hr />
                                <span>Datos Escuela</span>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isSchoolEnrolled"
                                        checked={formData.isSchoolEnrolled}
                                        onChange={handleChange}
                                    />
                                    <span>Matriculado en la escuela</span>
                                </label>
                            </div>
                            <div className="hidden-mobile"></div>

                            <div className="form-divider-row">
                                <hr />
                                <span>Datos del Tutor Legal</span>
                            </div>

                            <div className="form-group">
                                <label>Nombre y Apellidos del Tutor</label>
                                <input
                                    type="text"
                                    name="guardianName"
                                    value={formData.guardianName}
                                    onChange={handleChange}
                                    className={errors.guardianName ? 'error' : ''}
                                />
                                {errors.guardianName && <span className="error-text">{errors.guardianName}</span>}
                            </div>

                            <div className="form-group">
                                <label>DNI del Tutor</label>
                                <input
                                    type="text"
                                    name="guardianDni"
                                    value={formData.guardianDni}
                                    onChange={handleChange}
                                    className={errors.guardianDni ? 'error' : ''}
                                />
                                {errors.guardianDni && <span className="error-text">{errors.guardianDni}</span>}
                            </div>

                            <div className="form-group">
                                <label>Teléfono del Tutor</label>
                                <input
                                    type="text"
                                    name="guardianPhone"
                                    value={formData.guardianPhone}
                                    onChange={handleChange}
                                    className={errors.guardianPhone ? 'error' : ''}
                                />
                                {errors.guardianPhone && <span className="error-text">{errors.guardianPhone}</span>}
                            </div>

                            <div className="form-group">
                                <label>Email del Tutor</label>
                                <input
                                    type="email"
                                    name="guardianEmail"
                                    value={formData.guardianEmail}
                                    onChange={handleChange}
                                    className={errors.guardianEmail ? 'error' : ''}
                                />
                                {errors.guardianEmail && <span className="error-text">{errors.guardianEmail}</span>}
                            </div>
                        </>
                    )}

                    <div className="form-divider-row">
                        <hr />
                        <span>Foto / Documento (Opcional)</span>
                    </div>

                    <div className="form-group photo-upload-group">
                        <label>Adjuntar Imagen</label>
                        <div className="photo-upload-container">
                            <div className="photo-preview">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Vista previa" className="preview-img" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd', padding: '4px' }} />
                                ) : (
                                    <div className="preview-placeholder" style={{ width: '100px', height: '100px', borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>Sin imagen</div>
                                )}
                            </div>
                            <div className="file-input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                                {isUploading && <span className="uploading-text">Subiendo...</span>}
                                <small className="help-text">Máximo 1MB</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : (member?.id ? 'Guardar Cambios' : 'Crear Socio')}
                    </button>
                </div>
            </form >
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                isDestructive={confirmDialog.isDestructive}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default MemberForm;
