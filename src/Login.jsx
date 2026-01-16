import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Credenciales incorrectas');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Squash Ciudad de Murcia</h2>
                    <p>Acceso a Socios</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email o Usuario</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="btn btn-primary btn-block">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
