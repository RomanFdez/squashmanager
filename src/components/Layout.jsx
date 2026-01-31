import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Landmark, Settings, User, Sun, Moon, LogOut, Trophy, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

import { getConfig } from '../services/ConfigService';

const Layout = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, canAccessTreasury, isAdmin, logout } = useAuth();
    const [config, setConfig] = useState(getConfig());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleUpdate = (e) => setConfig(e.detail);
        window.addEventListener('configUpdated', handleUpdate);
        return () => window.removeEventListener('configUpdated', handleUpdate);
    }, []);

    // Close menu when location changes or on window resize
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className={`app-container ${isMenuOpen ? 'menu-open' : ''}`}>
            <header className="top-bar">
                <div className="top-bar-left">
                    <button
                        className="mobile-menu-toggle"
                        onClick={toggleMenu}
                        aria-label="Toggle Menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="logo">
                        {config.appLogo && <img src={config.appLogo} alt="Logo" className="app-logo-img" />}
                        <span className="logo-text">{config.appTitle}</span>
                    </div>
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

            {/* Overlay for mobile menu */}
            <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>

            <nav className={`sidebar-nav ${isMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {config.appLogo && <img src={config.appLogo} alt="Logo" className="sidebar-logo-img" />}
                        {!config.appLogo && <span className="logo-text-small">{config.appTitle}</span>}
                    </div>
                    <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="nav-links">
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
                        <NavLink to="/tournaments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><Trophy size={24} /></span>
                            <span className="nav-label">Torneos</span>
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
                </div>

                <div className="sidebar-footer">
                    <button className="logout-btn-sidebar" onClick={logout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </nav>

            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
