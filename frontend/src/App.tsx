import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from 'context/AuthContext';
import { PoolProvider } from 'context/PoolContext';
import { NotificationProvider } from 'context/NotificationContext';

// Layout
import Navbar from 'components/layout/Navbar';
import PoolLayout from 'components/layout/PoolLayout';
import NotificationToast from 'components/common/NotificationToast';

// Pages
import LandingPage from 'pages/LandingPage';
import LoginPage from 'pages/LoginPage';
import RegisterPage from 'pages/RegisterPage';
import DashboardPage from 'pages/DashboardPage';
import PoolOverviewPage from 'pages/PoolOverviewPage';
import ProposalsPage from 'pages/ProposalsPage';
import TreasuryPage from 'pages/TreasuryPage';
import CasesPage from 'pages/CasesPage';
import MembersPage from 'pages/MembersPage';
import AuditLogPage from 'pages/AuditLogPage';
import FederationPage from 'pages/FederationPage';
import PoolSettingsPage from 'pages/PoolSettingsPage';
import TransparencyPage from 'pages/TransparencyPage';
import AdminDashboardPage from 'pages/AdminDashboardPage';

// Styles
import 'styles/globals.css';

/** Route guard: requires authentication */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Route guard: requires super admin role */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><div className="spinner" /></div>;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <PoolProvider>
            <Navbar />
            <NotificationToast />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/transparency" element={<TransparencyPage />} />
              <Route path="/transparency/:poolId" element={<TransparencyPage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />

              {/* Pool routes with sidebar layout */}
              <Route path="/pool/:poolId" element={
                <ProtectedRoute><PoolLayout /></ProtectedRoute>
              }>
                <Route index element={<PoolOverviewPage />} />
                <Route path="proposals" element={<ProposalsPage />} />
                <Route path="treasury" element={<TreasuryPage />} />
                <Route path="cases" element={<CasesPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="federation" element={<FederationPage />} />
                <Route path="settings" element={<PoolSettingsPage />} />
              </Route>

              {/* Super Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute><AdminRoute><AdminDashboardPage /></AdminRoute></ProtectedRoute>
              } />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PoolProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
