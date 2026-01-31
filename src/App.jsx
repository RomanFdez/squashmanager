import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ClubProvider } from './context/ClubContext';
import Layout from './components/Layout';
import MemberList from './pages/MemberList';
import Treasury from './pages/Treasury';
import Admin from './pages/Admin';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import Login from './Login';
import TournamentPublic from './pages/TournamentPublic';
import ProtectedRoute from './components/ProtectedRoute';
import { useDynamicIcons } from './hooks/useDynamicIcons';

function App() {
  useDynamicIcons();

  return (
    <Router>
      <ThemeProvider>
        <ClubProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/torneo/:slug" element={<TournamentPublic />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/members" replace />} />
                <Route path="members" element={<MemberList />} />
                <Route path="treasury" element={
                  <ProtectedRoute requiredRole="treasury">
                    <Treasury />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="tournaments" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Tournaments />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ClubProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
