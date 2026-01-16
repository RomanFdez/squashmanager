import React, { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveMember } from '../services/MemberService';
import { validatePassword } from '../utils/validators';
import DigitalCard from '../components/DigitalCard';
import { Eye, EyeOff } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    if (!user) return <div>No has iniciado sesión.</div>;

    const isSystemAdmin = user.role === ROLES.ADMIN;

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setErrors({});
        setSuccessMessage('');
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        const { newPassword, confirmPassword } = passwordData;
        const newErrors = {};

        if (!validatePassword(newPassword)) {
            newErrors.newPassword = 'Mínimo 8 caracteres, una mayúscula, un número y un símbolo';
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // Update member in storage
            const updatedMember = { ...user, password: newPassword };
            await saveMember(user, updatedMember); // Pass user (context) as first arg for audit log

            // Update local user state
            updateUser(updatedMember);

            setSuccessMessage('Contraseña actualizada correctamente');
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            setErrors({ submit: 'Error al actualizar la contraseña' });
        }
    };

    return (
        <div className="profile-page container">
            <div className="page-header">
                <h1>Mi Perfil</h1>
            </div>

            <div className="profile-card card">
                <div className="profile-photo-large">
                    {user.photo ? (
                        <img src={user.photo} alt={user.name} className="profile-photo-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div className="photo-placeholder">{user.name ? user.name.charAt(0) : 'U'}</div>
                    )}
                </div>
                <h2 className="profile-name">{user.name}</h2>
                <span className="profile-role">{user.role}</span>
                {user.memberNumber && <span className="profile-number">Socio #{user.memberNumber}</span>}
            </div>

            <div className="section digital-card-section">
                <h3>Carnet Digital</h3>
                <DigitalCard member={user} />
            </div>

            <div className="profile-settings section">
                <h3>Ajustes</h3>
                <div className="settings-list card">
                    <div className="setting-item">
                        <span>Modo Oscuro</span>
                        <button className={`toggle-switch ${isDarkMode ? 'on' : ''}`} onClick={toggleTheme}>
                            <div className="switch-knob"></div>
                        </button>
                    </div>
                </div>
            </div>

            {!isSystemAdmin && (
                <div className="profile-security section">
                    <h3>Seguridad</h3>
                    <form className="security-form card" onSubmit={handleSavePassword}>
                        <h4>Cambiar Contraseña</h4>

                        <div className="form-group">
                            <label>Nueva Contraseña</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className={errors.newPassword ? 'error' : ''}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                        </div>

                        <div className="form-group">
                            <label>Repetir Nueva Contraseña</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className={errors.confirmPassword ? 'error' : ''}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>

                        {errors.submit && <div className="error-message">{errors.submit}</div>}
                        {successMessage && <div className="success-message">{successMessage}</div>}

                        <button type="submit" className="btn btn-primary">
                            Actualizar Contraseña
                        </button>
                    </form>
                </div>
            )}

            <button className="btn btn-secondary logout-btn" onClick={logout}>
                Cerrar Sesión
            </button>

            <div className="app-info">
                <p>Squash Ciudad de Murcia v1.0</p>
            </div>
        </div>
    );
};

export default Profile;
