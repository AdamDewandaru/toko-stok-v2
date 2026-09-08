import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserIcon, LogoutIcon } from '../../components/Icons';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/masuk');
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profil</h1>
        </div>
      </div>

      <div className="card flex items-center gap-12">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--teal-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserIcon stroke="var(--teal-dark)" />
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>{user.name}</div>
          <div className="muted text-sm">@{user.username} · {user.store?.name}</div>
        </div>
      </div>

      <div className="section-title">Ubah Password</div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleChangePassword}>
          <div className="field">
            <label htmlFor="currentPassword">Password saat ini</label>
            <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="newPassword">Password baru</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" required />
          </div>
          <button className="btn btn-primary btn-block" disabled={saving} type="submit">
            {saving ? 'Menyimpan…' : 'Simpan Password'}
          </button>
        </form>
      </div>

      <button className="btn btn-secondary btn-block mt-24" onClick={handleLogout}>
        <LogoutIcon width={16} height={16} /> Keluar
      </button>
    </div>
  );
}
