import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StockStatusBadge } from '../components/StatusBadge';
import { SearchIcon } from '../components/Icons';

export default function RecordForm({ historyPath, homePath }) {
  const { type: typeParam } = useParams(); // 'masuk' | 'keluar'
  const type = typeParam === 'masuk' ? 'IN' : 'OUT';
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isOwner = user.role === 'owner';

  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(user.role === 'staff' ? user.store?.id : '');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [isAdjustment, setIsAdjustment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOwner) {
      api.get('/stores').then((res) => {
        const active = res.data.filter((s) => s.is_active);
        setStores(active);
        if (active.length === 1) setStoreId(active[0].id);
      });
    }
    api.get('/categories').then((res) => setCategories(res.data));
  }, [isOwner]);

  const loadProducts = useCallback(async () => {
    if (isOwner && !storeId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/stock/products', { storeId, search, categoryId });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, [storeId, search, categoryId, isOwner]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [loadProducts]);

  function setQty(productId, qty) {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  const cartItems = useMemo(
    () =>
      Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find((p) => p.id === Number(productId));
        return { productId: Number(productId), quantity, product };
      }),
    [cart, products]
  );

  const totalItems = cartItems.length;
  const hasInsufficient =
    type === 'OUT' &&
    !isAdjustment &&
    cartItems.some((i) => i.product && i.quantity > i.product.stock);

  async function handleSubmit() {
    setError('');
    if (totalItems === 0) {
      setError('Pilih minimal satu barang terlebih dahulu.');
      return;
    }
    if (hasInsufficient) {
      setError('Ada barang yang jumlahnya melebihi stok tersedia. Perbaiki jumlah atau gunakan penyesuaian stok.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type,
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        notes: notes || undefined,
      };
      if (isOwner) payload.storeId = Number(storeId);
      if (isOwner && type === 'OUT') payload.isAdjustment = isAdjustment;

      const res = await api.post('/stock/transactions', payload);
      toast.success(res.message);
      navigate(historyPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel = type === 'IN' ? 'Barang Masuk' : 'Barang Keluar';

  return (
    <div className="page" style={{ paddingBottom: 140 }}>
      <div className="page-header">
        <div>
          <h1>{typeLabel}</h1>
          <p>Pilih barang dan masukkan jumlahnya.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isOwner && stores.length > 1 && (
        <div className="field">
          <label htmlFor="recordStore">Toko</label>
          <select id="recordStore" value={storeId} onChange={(e) => setStoreId(Number(e.target.value))}>
            <option value="">Pilih toko</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="search-bar">
        <SearchIcon width={18} height={18} stroke="var(--ink-soft)" style={{ marginLeft: 4 }} />
        <input placeholder="Cari nama barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="chip-row">
        <button className={`chip ${categoryId === '' ? 'active' : ''}`} onClick={() => setCategoryId('')}>
          Semua
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${categoryId === c.id ? 'active' : ''}`}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isOwner && type === 'OUT' && (
        <label className="flex items-center gap-8 text-sm" style={{ marginBottom: 14, fontWeight: 600 }}>
          <input type="checkbox" checked={isAdjustment} onChange={(e) => setIsAdjustment(e.target.checked)} />
          Ini penyesuaian stok (izinkan jumlah melebihi stok tercatat)
        </label>
      )}

      {loading ? (
        <p className="muted text-sm">Memuat barang…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>Barang tidak ditemukan</h3>
          <p>Coba kata kunci lain atau pilih kategori lain.</p>
        </div>
      ) : (
        <div>
          {products.map((p) => {
            const qty = cart[p.id] || 0;
            const overLimit = type === 'OUT' && !isAdjustment && qty > p.stock;
            return (
              <div className="picker-row" key={p.id}>
                <div className="picker-row__info">
                  <div className="picker-row__name">{p.name}</div>
                  <div className="picker-row__meta">
                    {p.brand_name ? `${p.brand_name} · ` : ''}
                    Stok: {p.stock} {overLimit && <span style={{ color: 'var(--rust)' }}>· melebihi stok</span>}
                  </div>
                </div>
                <StockStatusBadge status={p.status} />
                <div className="stepper">
                  <button type="button" onClick={() => setQty(p.id, Math.max(0, qty - 1))}>
                    −
                  </button>
                  <input
                    value={qty}
                    onChange={(e) => setQty(p.id, Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))}
                  />
                  <button type="button" onClick={() => setQty(p.id, qty + 1)}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="field mt-16">
        <label htmlFor="recordNotes">Catatan (opsional)</label>
        <textarea id="recordNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="cth. Kiriman dari agen Sampoerna" />
      </div>

      <div className="record-submit-bar">
        <div className="flex items-center justify-between" style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="text-sm">
            <strong>{totalItems}</strong> barang dipilih
          </div>
          <button className="btn btn-primary" disabled={submitting || totalItems === 0} onClick={handleSubmit}>
            {submitting ? 'Menyimpan…' : `Simpan ${typeLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
