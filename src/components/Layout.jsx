import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Landmark, Settings, User, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

import { getConfig } from '../services/ConfigService';

const Layout = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, canAccessTreasury, isAdmin, logout } = useAuth();
    const [config, setConfig] = React.useState(getConfig());

    React.useEffect(() => {
        const handleUpdate = (e) => setConfig(e.detail);
        window.addEventListener('configUpdated', handleUpdate);
        return () => window.removeEventListener('configUpdated', handleUpdate);
    }, []);

    return (
        <div className="app-container">
            <header className="top-bar">
                <div className="logo">
                    {config.appLogo && <img src={config.appLogo} alt="Logo" className="app-logo-img" />}
                    <span className="logo-text">{config.appTitle}</span>
                </div>
                <div className="top-actions">
                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="theme-toggle" onClick={logout} aria-label="Logout" title="Cerrar Sesión">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="content">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <div className="sidebar-logo">
                    {config.appLogo && <img src={config.appLogo} alt="Logo" className="sidebar-logo-img" />}
                    {!config.appLogo && <span className="logo-text-small">{config.appTitle}</span>}
                </div>

                <NavLink to="/members" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon"><Users size={24} /></span>
                    <span className="nav-label">Socios</span>
                </NavLink>

                {canAccessTreasury && (
                    <NavLink to="/treasury" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><Landmark size={24} /></span>
                        <span className="nav-label">Tesorería</span>
                    </NavLink>
                )}

                {isAdmin && (
                    <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><Settings size={24} /></span>
                        <span className="nav-label">Admin</span>
                    </NavLink>
                )}

                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon"><User size={24} /></span>
                    <span className="nav-label">Perfil</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default Layout;
