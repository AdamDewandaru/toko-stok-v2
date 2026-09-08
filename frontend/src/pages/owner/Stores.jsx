import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useStoreScope } from '../../context/StoreScopeContext';
import { PlusIcon, CloseIcon } from '../../components/Icons';

function StoreSheet({ store, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(store?.name || '');
  const [address, setAddress] = useState(store?.address || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      if (store) {
        await api.put(`/stores/${store.id}`, { name, address });
        toast.success('Toko berhasil diperbarui.');
      } else {
        await api.post('/stores', { name, address });
        toast.success('Toko berhasil ditambahkan.');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{store ? 'Ubah Toko' : 'Tambah Toko'}</h2>
          <button className="sheet-close" onClick={onClose}><CloseIcon width={16} height={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="storeName">Nama toko</label>
          <input id="storeName" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="storeAddress">Alamat (opsional)</label>
          <input id="storeAddress" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

export default function Stores() {
  const toast = useToast();
  const { reloadStores } = useStoreScope();
  const [stores, setStores] = useState([]);
  const [maxStores, setMaxStores] = useState(3);
  const [loading, setLoading] = useState(true);
  const [sheetStore, setSheetStore] = useState(undefined);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/stores');
      setStores(res.data);
      setMaxStores(res.maxStores);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(store) {
    try {
      await api.patch(`/stores/${store.id}/active`, { isActive: !store.is_active });
      toast.success(store.is_active ? 'Toko dinonaktifkan.' : 'Toko diaktifkan kembali.');
      load();
      reloadStores();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const activeCount = stores.filter((s) => s.is_active).length;
  const canAdd = activeCount < maxStores;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kelola Toko</h1>
          <p>{activeCount} dari {maxStores} toko aktif digunakan</p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setSheetStore(null)}>
            <PlusIcon width={16} height={16} /> Tambah Toko
          </button>
        )}
      </div>

      {!canAdd && (
        <div className="alert alert-info">
          Anda sudah menggunakan batas maksimal {maxStores} toko aktif. Nonaktifkan salah satu toko untuk menambah yang baru.
        </div>
      )}

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : (
        <div className="list">
          {stores.map((s) => (
            <div className="list-row" key={s.id}>
              <div>
                <div className="list-row__title">
                  {s.name} {!s.is_active && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>Nonaktif</span>}
                </div>
                <div className="list-row__meta">{s.code}{s.address ? ` · ${s.address}` : ''}</div>
              </div>
              <div className="flex items-center gap-8">
                <button className="btn btn-secondary btn-sm" onClick={() => setSheetStore(s)}>Ubah</button>
                <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(s)}>
                  {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sheetStore !== undefined && (
        <StoreSheet
          store={sheetStore}
          onClose={() => setSheetStore(undefined)}
          onSaved={() => {
            setSheetStore(undefined);
            load();
            reloadStores();
          }}
        />
      )}
    </div>
  );
}
