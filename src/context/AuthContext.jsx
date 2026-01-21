import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateUserFromSession(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            updateUserFromSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateUserFromSession = async (session) => {
        if (!session?.user) {
            setUser(null);
            setLoading(false);
            return;
        }

        const email = session.user.email;

        // Base user structure
        let userData = {
            id: session.user.id, // Auth ID
            email: email,
            role: ROLES.SOCIO, // Default fallback
            name: email.split('@')[0], // Default fallback
            auth_id: session.user.id
        };

        // 1. Check if it's the Super Admin (System Admin)
        if (email === 'admin@squashciudadmurcia.com' || email === 'admin') {
            userData = {
                ...userData,
                id: 'admin_sys', // Maintain legacy ID if needed or use auth_id
                name: 'Administrador del Sistema',
                role: ROLES.ADMIN,
                isSuperAdmin: true
            };
        } else {
            // 2. Fetch from Members table to get Real Name and Role
            try {
                // We assume email is unique in members table
                const { data: member, error } = await supabase
                    .from('members')
                    .select('*')
                    .eq('email', email)
                    .limit(1)
                    .maybeSingle();

                if (member) {
                    // Merge Auth data with Member Data
                    // Member data takes precedence for Name/Role
                    userData = {
                        ...userData,
                        ...member,
                        // Map snake_case to camelCase for App consistency
                        photo: member.photo_url,
                        memberNumber: member.member_number,
                        isPaid: member.is_paid,
                        leaveDate: member.leave_date,
                        birthDate: member.birth_date,
                        auth_id: session.user.id
                    };
                }
            } catch (err) {
                console.error("Error fetching member details for auth:", err);
            }
        }

        setUser(userData);
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Supabase Login Error:", error.message);
                alert("Error de inicio de sesión: " + (error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message));
                return false;
            }
            return true;
        } catch (err) {
            console.error("Login unexpected error:", err);
            return false;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // Permission Logic
    const isSuperAdmin = user?.role === ROLES.ADMIN;

    // Roles with Admin-like privileges (Board Members)
    const adminRoles = [ROLES.PRESIDENTE, ROLES.SECRETARIO, ROLES.TESORERO];

    const isAdmin = isSuperAdmin || adminRoles.includes(user?.role);

    // Manage Members: Admin + AdminRoles
    const canManageMembers = isAdmin;

    // Access Treasury: Admin + AdminRoles + Vocal
    const canAccessTreasury = isAdmin || user?.role === ROLES.VOCAL;

    const updateUser = (data) => setUser({ ...user, ...data });

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            updateUser,
            canManageMembers,
            canAccessTreasury,
            isAdmin,
            ROLES
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
