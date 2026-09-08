import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="muted">Memuat…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/masuk" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'owner' ? '/owner' : '/staf'} replace />;
  }
  if (role === 'owner' && user.hasStores === false) {
    return <Navigate to="/onboarding/toko" replace />;
  }
  return children;
}

export function RequireOwner({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-shell">
        <p className="muted">Memuat…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/masuk" replace />;
  if (user.role !== 'owner') return <Navigate to="/staf" replace />;
  return children;
}

export function RequireGuest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'owner') {
      return <Navigate to={user.hasStores === false ? '/onboarding/toko' : '/owner'} replace />;
    }
    return <Navigate to="/staf" replace />;
  }
  return children;
}
