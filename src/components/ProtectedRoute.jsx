import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, requireAdmin }) => {
    const { user, isAdmin, canAccessTreasury } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/members" replace />;
    }

    // Special check for Treasury
    if (requiredRole === 'treasury' && !canAccessTreasury) {
        return <Navigate to="/members" replace />;
    }

    return children;
};

export default ProtectedRoute;
