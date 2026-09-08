import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { StoreScopeProvider } from './context/StoreScopeContext';
import { RequireAuth, RequireOwner, RequireGuest } from './components/Guards';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import OnboardingStore from './pages/auth/OnboardingStore';
import OnboardingStaff from './pages/auth/OnboardingStaff';

import AppLayout from './layouts/AppLayout';
import OwnerDashboard from './pages/owner/Dashboard';
import Products from './pages/owner/Products';
import Stores from './pages/owner/Stores';
import StaffPage from './pages/owner/Staff';
import Reports from './pages/owner/Reports';

import StaffDashboard from './pages/staff/Dashboard';
import Profile from './pages/staff/Profile';

import StockView from './pages/StockView';
import HistoryView from './pages/HistoryView';
import RecordChoice from './pages/RecordChoice';
import RecordForm from './pages/RecordForm';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/masuk" replace />;
  if (user.role === 'owner') return <Navigate to={user.hasStores === false ? '/onboarding/toko' : '/owner'} replace />;
  return <Navigate to="/staf" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <StoreScopeProvider>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              <Route path="/masuk" element={<RequireGuest><Login /></RequireGuest>} />
              <Route path="/daftar" element={<RequireGuest><Register /></RequireGuest>} />
              <Route path="/lupa-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />

              <Route
                path="/onboarding/toko"
                element={
                  <RequireOwner>
                    <OnboardingStore />
                  </RequireOwner>
                }
              />
              <Route
                path="/onboarding/staf"
                element={
                  <RequireOwner>
                    <OnboardingStaff />
                  </RequireOwner>
                }
              />

              <Route
                path="/owner"
                element={
                  <RequireAuth role="owner">
                    <AppLayout role="owner" />
                  </RequireAuth>
                }
              >
                <Route index element={<OwnerDashboard />} />
                <Route path="stok" element={<StockView />} />
                <Route path="riwayat" element={<HistoryView />} />
                <Route path="laporan" element={<Reports />} />
                <Route path="barang" element={<Products />} />
                <Route path="toko" element={<Stores />} />
                <Route path="staf" element={<StaffPage />} />
                <Route path="catat" element={<RecordChoice basePath="/owner/catat" />} />
                <Route path="catat/:type" element={<RecordForm historyPath="/owner/riwayat" />} />
              </Route>

              <Route
                path="/staf"
                element={
                  <RequireAuth role="staff">
                    <AppLayout role="staff" />
                  </RequireAuth>
                }
              >
                <Route index element={<StaffDashboard />} />
                <Route path="stok" element={<StockView />} />
                <Route path="riwayat" element={<HistoryView />} />
                <Route path="profil" element={<Profile />} />
                <Route path="catat" element={<RecordChoice basePath="/staf/catat" />} />
                <Route path="catat/:type" element={<RecordForm historyPath="/staf/riwayat" />} />
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </StoreScopeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
