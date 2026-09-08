import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PlusIcon, CloseIcon } from '../../components/Icons';

function StaffSheet({ staff, stores, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(staff?.name || '');
  const [username, setUsername] = useState(staff?.username || '');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState(staff?.store_id || stores[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      if (staff) {
        await api.put(`/staff/${staff.id}`, { name, storeId: Number(storeId) });
        toast.success('Data staf berhasil diperbarui.');
      } else {
        await api.post('/staff', { name, username, password, storeId: Number(storeId) });
        toast.success('Staf berhasil ditambahkan.');
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
          <h2>{staff ? 'Ubah Staf' : 'Tambah Staf'}</h2>
          <button className="sheet-close" onClick={onClose}><CloseIcon width={16} height={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="staffSheetName">Nama</label>
          <input id="staffSheetName" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        {!staff && (
          <>
            <div className="field">
              <label htmlFor="staffSheetUsername">Username</label>
              <input id="staffSheetUsername" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="staffSheetPassword">Password</label>
              <input id="staffSheetPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="staffSheetStore">Toko penugasan</label>
          <select id="staffSheetStore" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordSheet({ staff, onClose, onSaved }) {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await api.patch(`/staff/${staff.id}/password`, { newPassword });
      toast.success('Password berhasil direset.');
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
          <h2>Reset Password — {staff.name}</h2>
          <button className="sheet-close" onClick={onClose}><CloseIcon width={16} height={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="resetNewPassword">Password baru</label>
          <input id="resetNewPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" autoFocus />
        </div>
        <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

export default function Staff() {
  const toast = useToast();
  const [staffList, setStaffList] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetStaff, setSheetStaff] = useState(undefined);
  const [resetStaff, setResetStaff] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([api.get('/staff'), api.get('/stores')]);
      setStaffList(s.data);
      setStores(st.data.filter((x) => x.is_active));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(staff) {
    try {
      await api.patch(`/staff/${staff.id}/active`, { isActive: !staff.is_active });
      toast.success(staff.is_active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan kembali.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kelola Staf</h1>
          <p>{staffList.length} akun staf</p>
        </div>
        {stores.length > 0 && (
          <button className="btn btn-primary" onClick={() => setSheetStaff(null)}>
            <PlusIcon width={16} height={16} /> Tambah Staf
          </button>
        )}
      </div>

      {stores.length === 0 && (
        <div className="alert alert-info">Tambahkan toko terlebih dahulu sebelum membuat akun staf.</div>
      )}

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : staffList.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada staf</h3>
          <p>Tambahkan akun untuk penjaga toko Anda.</p>
        </div>
      ) : (
        <div className="list">
          {staffList.map((s) => (
            <div className="list-row" key={s.id}>
              <div>
                <div className="list-row__title">
                  {s.name} {!s.is_active && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>Nonaktif</span>}
                </div>
                <div className="list-row__meta">@{s.username} · {s.store_name || 'Belum ditugaskan'}</div>
              </div>
              <div className="flex items-center gap-8">
                <button className="btn btn-secondary btn-sm" onClick={() => setSheetStaff(s)}>Ubah</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setResetStaff(s)}>Reset Sandi</button>
                <button className="btn btn-danger btn-sm" onClick={() => toggleActive(s)}>
                  {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sheetStaff !== undefined && (
        <StaffSheet
          staff={sheetStaff}
          stores={stores}
          onClose={() => setSheetStaff(undefined)}
          onSaved={() => {
            setSheetStaff(undefined);
            load();
          }}
        />
      )}
      {resetStaff && (
        <ResetPasswordSheet staff={resetStaff} onClose={() => setResetStaff(null)} onSaved={() => setResetStaff(null)} />
      )}
    </div>
  );
}
