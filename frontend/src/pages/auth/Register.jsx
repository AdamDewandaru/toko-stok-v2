import { useState } from 'react';
import BrandMark from '../../components/BrandMark';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    username: '',
    password: '',
    confirmPassword: '',
    recoveryQuestion: '',
    recoveryAnswer: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/onboarding/toko');
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
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Daftar sebagai Pemilik</h1>
        <p className="muted text-sm" style={{ marginBottom: 22 }}>
          Buat akun usaha Anda. Anda bisa menambahkan hingga 3 toko dan staf setelah ini.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ownerName">Nama Anda</label>
            <input
              id="ownerName"
              value={form.ownerName}
              onChange={(e) => update('ownerName', e.target.value)}
              placeholder="cth. Adam Prasetyo"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="businessName">Nama usaha (opsional)</label>
            <input
              id="businessName"
              value={form.businessName}
              onChange={(e) => update('businessName', e.target.value)}
              placeholder="cth. Berkah Jaya Group"
            />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              placeholder="Untuk login, tanpa spasi"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Ulangi Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="recoveryQuestion">Pertanyaan keamanan</label>
            <input
              id="recoveryQuestion"
              value={form.recoveryQuestion}
              onChange={(e) => update('recoveryQuestion', e.target.value)}
              placeholder="cth. Nama hewan peliharaan pertama?"
              required
            />
            <div className="field-hint">Dipakai untuk memulihkan akun kalau Anda lupa password nanti.</div>
          </div>
          <div className="field">
            <label htmlFor="recoveryAnswer">Jawaban rahasia</label>
            <input
              id="recoveryAnswer"
              value={form.recoveryAnswer}
              onChange={(e) => update('recoveryAnswer', e.target.value)}
              placeholder="Ingat-ingat jawaban ini"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Memproses…' : 'Buat Akun'}
          </button>
        </form>

        <p className="text-center text-sm muted" style={{ marginTop: 20 }}>
          Sudah punya akun? <Link to="/masuk" style={{ fontWeight: 700 }}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
