// Main App component for Prestige Delivery Admin Dashboard
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PartnersPage from './pages/PartnersPage';
import Home from './pages/Home';
import DashboardOverview from './pages/DashboardOverview';
import RidersPage from './pages/RidersPage';
import DeliveriesPage from './pages/DeliveriesPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import ReconciliationPage from './pages/ReconciliationPage';
import DashboardLayout from './layout/DashboardLayout';
import PartnerDashboardLayout from './layout/PartnerDashboardLayout';
import PartnerDashboardOverview from './pages/partner/PartnerDashboardOverview';
import PartnerMenuPage from './pages/partner/PartnerMenuPage';
import PartnerOrdersPage from './pages/partner/PartnerOrdersPage';

const ProtectedRoute = ({ children, allowedRoles = ['ADMIN'] }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'PARTNER' ? '/partner-dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/partners" element={<PartnersPage />} /> */}

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <DashboardOverview />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/riders" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <RidersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/deliveries" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <DeliveriesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/partners" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <PartnersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/chat" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ChatPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/reconciliation" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ReconciliationPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* PARTNER ROUTES */}
            <Route path="/partner-dashboard" element={
              <ProtectedRoute allowedRoles={['PARTNER']}>
                <PartnerDashboardLayout>
                  <PartnerDashboardOverview />
                </PartnerDashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/partner-dashboard/menu" element={
              <ProtectedRoute allowedRoles={['PARTNER']}>
                <PartnerDashboardLayout>
                  <PartnerMenuPage />
                </PartnerDashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/partner-dashboard/orders" element={
              <ProtectedRoute allowedRoles={['PARTNER']}>
                <PartnerDashboardLayout>
                  <PartnerOrdersPage />
                </PartnerDashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
