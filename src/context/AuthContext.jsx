import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMembers } from '../services/MemberService';

const AuthContext = createContext();

export const ROLES = {
    ADMIN: 'admin',
    PRESIDENTE: 'Presidente',
    VICEPRESIDENTE: 'Vicepresidente',
    SECRETARIO: 'Secretario',
    TESORERO: 'Tesorero',
    VOCAL: 'Vocal',
    SOCIO: 'Socio'
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Initialize from localStorage if available
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [user]);

    const adminUser = {
        id: 'admin_sys',
        name: 'Administrador del Sistema',
        role: ROLES.ADMIN,
        email: 'admin'
    };

    const login = async (emailOrUser, password) => {
        // 1. Check Admin
        if ((emailOrUser === 'admin' || emailOrUser === 'admin@squashciudadmurcia.com') && password === 'Clavecita1!') {
            setUser(adminUser);
            return true;
        }

        // 2. Check Members
        try {
            const members = await getMembers();
            const member = members.find(m =>
                (m.email === emailOrUser || m.memberNumber === emailOrUser) &&
                m.status !== 'inactive' // Only active members
            );

            if (member) {
                // Verify password
                // In a real app, hash checking. Here direct comparison.
                if (member.password === password) {
                    setUser(member);
                    return true;
                }
            }
        } catch (error) {
            console.error("Login verification failed", error);
        }

        return false;
    };

    const logout = () => setUser(null);

    // Permission Logic
    // Admin has full access
    const isSuperAdmin = user?.role === ROLES.ADMIN;

    // Roles with Admin-like privileges
    const adminRoles = [ROLES.PRESIDENTE, ROLES.SECRETARIO, ROLES.TESORERO];

    const isAdmin = isSuperAdmin || adminRoles.includes(user?.role);

    // Manage Members: Admin + AdminRoles
    const canManageMembers = isAdmin;

    // Access Treasury: Admin + AdminRoles + Vocal
    const canAccessTreasury = isAdmin || user?.role === ROLES.VOCAL;

    const updateUser = (userData) => setUser(userData);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updateUser,
            canManageMembers,
            canAccessTreasury,
            isAdmin,
            ROLES
        }}>
            {children}
        </AuthContext.Provider>
    );
};
