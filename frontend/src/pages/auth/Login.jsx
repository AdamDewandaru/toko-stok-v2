import { useState } from 'react';
import BrandMark from '../../components/BrandMark';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      if (user.role === 'owner') {
        navigate(user.hasStores ? '/owner' : '/onboarding/toko');
      } else {
        navigate('/staf');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <BrandMark />
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Masuk ke akun Anda</h1>
        <p className="muted text-sm" style={{ marginBottom: 22 }}>
          Catat barang masuk dan keluar, pantau stok dari mana saja.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
            <div className="field-hint" style={{ textAlign: 'right' }}>
              <Link to="/lupa-password">Lupa password?</Link>
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm muted" style={{ marginTop: 20 }}>
          Belum punya akun usaha?{' '}
          <Link to="/daftar" style={{ fontWeight: 700 }}>
            Daftar sebagai Pemilik
          </Link>
        </p>
      </div>
    </div>
  );
}
