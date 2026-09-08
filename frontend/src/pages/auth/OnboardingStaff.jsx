import { useEffect, useState } from 'react';
import BrandMark from '../../components/BrandMark';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function OnboardingStaff() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/stores').then((res) => {
      setStores(res.data);
      if (res.data[0]) setStoreId(String(res.data[0].id));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/staff', { name, username, password, storeId: Number(storeId) });
      navigate('/owner');
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
        <div className="onboarding-steps">
          <span className="done" />
          <span className="done" />
        </div>
        <h1 style={{ fontSize: 21, marginBottom: 4 }}>Tambahkan penjaga toko</h1>
        <p className="muted text-sm" style={{ marginBottom: 22 }}>
          Staf hanya bisa mencatat barang masuk/keluar di toko yang Anda tugaskan. Bisa dilewati dan ditambahkan nanti.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="staffStore">Toko</label>
            <select id="staffStore" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="staffName">Nama staf</label>
            <input id="staffName" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Andi" required />
          </div>
          <div className="field">
            <label htmlFor="staffUsername">Username</label>
            <input id="staffUsername" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="staffPassword">Password</label>
            <input
              id="staffPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Menyimpan…' : 'Tambah & Selesai'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block mt-8"
            onClick={() => navigate('/owner')}
          >
            Lewati, ke Beranda
          </button>
        </form>
      </div>
    </div>
  );
}
