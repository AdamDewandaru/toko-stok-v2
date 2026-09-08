import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStoreScope } from '../context/StoreScopeContext';
import { StockStatusBadge } from '../components/StatusBadge';
import { SearchIcon } from '../components/Icons';

export default function StockView() {
  const { user } = useAuth();
  const isOwner = user.role === 'owner';
  const scope = useStoreScope();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | low | out

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const storeId = isOwner ? scope.selectedStoreId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/products', { storeId, search, categoryId });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, [storeId, search, categoryId]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.status === 'MENIPIS';
    if (filter === 'out') return p.status === 'HABIS';
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Stok Barang</h1>
          <p>{filtered.length} barang ditampilkan</p>
        </div>
      </div>

      <div className="search-bar">
        <SearchIcon width={18} height={18} stroke="var(--ink-soft)" style={{ marginLeft: 4 }} />
        <input placeholder="Cari nama barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="chip-row">
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Semua</button>
        <button className={`chip ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')}>Menipis</button>
        <button className={`chip ${filter === 'out' ? 'active' : ''}`} onClick={() => setFilter('out')}>Habis</button>
        {categories.map((c) => (
          <button key={c.id} className={`chip ${categoryId === c.id ? 'active' : ''}`} onClick={() => setCategoryId(categoryId === c.id ? '' : c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak ada barang</h3>
          <p>Coba ubah kata kunci atau filter.</p>
        </div>
      ) : (
        <div className="list">
          {filtered.map((p) => (
            <div className="list-row" key={p.id}>
              <div>
                <div className="list-row__title">{p.name}</div>
                <div className="list-row__meta">
                  {p.brand_name ? `${p.brand_name} · ` : ''}
                  {p.category_name} · min. {p.minimum_stock}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <strong>{p.stock}</strong>
                <StockStatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
