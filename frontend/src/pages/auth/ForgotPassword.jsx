import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import BrandMark from '../../components/BrandMark';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter username, 2 = answer + new password
  const [username, setUsername] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFindAccount(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/auth/recovery-question', { username: username.trim() });
      setRecoveryQuestion(res.recoveryQuestion);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        username: username.trim(),
        recoveryAnswer,
        newPassword,
      });
      setSuccess('Password berhasil direset. Mengarahkan ke halaman masuk…');
      setTimeout(() => navigate('/masuk'), 1500);
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
        <h1 style={{ fontSize: 21, marginBottom: 4 }}>Lupa Password</h1>
        <p className="muted text-sm" style={{ marginBottom: 22 }}>
          Fitur ini hanya untuk akun Pemilik. Password staf direset oleh pemilik lewat menu Kelola Staf.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleFindAccount}>
            <div className="field">
              <label htmlFor="fpUsername">Username akun Pemilik</label>
              <input id="fpUsername" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? 'Mencari…' : 'Lanjut'}
            </button>
          </form>
        )}

        {step === 2 && !success && (
          <form onSubmit={handleReset}>
            <div className="field">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>
                Pertanyaan keamanan
              </div>
              <div className="alert alert-info" style={{ marginBottom: 0 }}>{recoveryQuestion}</div>
            </div>
            <div className="field">
              <label htmlFor="fpAnswer">Jawaban Anda</label>
              <input id="fpAnswer" value={recoveryAnswer} onChange={(e) => setRecoveryAnswer(e.target.value)} autoFocus required />
            </div>
            <div className="field">
              <label htmlFor="fpNewPassword">Password baru</label>
              <input
                id="fpNewPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="fpConfirmPassword">Ulangi password baru</label>
              <input
                id="fpConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? 'Menyimpan…' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm muted" style={{ marginTop: 20 }}>
          <Link to="/masuk" style={{ fontWeight: 700 }}>Kembali ke halaman masuk</Link>
        </p>
      </div>
    </div>
  );
}
