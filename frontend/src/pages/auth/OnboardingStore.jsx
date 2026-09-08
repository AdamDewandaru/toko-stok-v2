import { useState } from 'react';
import BrandMark from '../../components/BrandMark';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function OnboardingStore() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/stores', { name, address });
      navigate('/onboarding/staf');
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
          <span />
        </div>
        <h1 style={{ fontSize: 21, marginBottom: 4 }}>Tambahkan toko pertama Anda</h1>
        <p className="muted text-sm" style={{ marginBottom: 22 }}>
          Setiap toko punya stok dan riwayat transaksi masing-masing. Anda bisa menambah hingga 3 toko.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="storeName">Nama toko</label>
            <input
              id="storeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Berkah Jaya 1"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="storeAddress">Alamat (opsional)</label>
            <input
              id="storeAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="cth. Jl. Mawar No. 12"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Menyimpan…' : 'Lanjut'}
          </button>
        </form>
      </div>
    </div>
  );
}
