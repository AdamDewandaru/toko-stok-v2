import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { StoreScopeProvider } from '../context/StoreScopeContext';
import { setAuthToken } from '../api/client';

/**
 * Mirrors what <RequireAuth> does in the real app: withholds rendering the
 * page under test until AuthProvider has resolved its initial `/auth/me`
 * call. Without this, pages that call useAuth() and immediately read
 * `user.role` would crash on the first render pass, when `user` is still
 * null and `loading` is true — a false negative that has nothing to do
 * with the page itself.
 */
function AuthGate({ children }) {
  const { loading } = useAuth();
  if (loading) return null;
  return children;
}

/**
 * Renders `ui` inside the same provider stack the real app uses
 * (AuthProvider + ToastProvider + StoreScopeProvider + MemoryRouter).
 * If `authed` is true, seeds a fake token first so AuthProvider's initial
 * `/auth/me` fetch (handled by the installed fetch mock) resolves to a
 * logged-in user instead of null.
 */
export function renderWithProviders(ui, { route = '/', authed = false } = {}) {
  if (authed) setAuthToken('fake-token');
  else setAuthToken(null);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>
          <StoreScopeProvider>
            <AuthGate>{ui}</AuthGate>
          </StoreScopeProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}
