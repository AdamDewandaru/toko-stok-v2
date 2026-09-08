import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PlusIcon, SearchIcon, CloseIcon } from '../../components/Icons';

function ProductSheet({ product, categories, brands, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || categories[0]?.id || '');
  const [brandId, setBrandId] = useState(product?.brand_id || '');
  const [minimumStock, setMinimumStock] = useState(product?.minimum_stock ?? 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const payload = { name, categoryId: Number(categoryId), brandId: brandId ? Number(brandId) : null, minimumStock: Number(minimumStock) };
      if (product) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Barang berhasil diperbarui.');
      } else {
        await api.post('/products', payload);
        toast.success('Barang berhasil ditambahkan.');
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
          <h2>{product ? 'Ubah Barang' : 'Tambah Barang'}</h2>
          <button className="sheet-close" onClick={onClose}><CloseIcon width={16} height={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="productName">Nama barang</label>
          <input id="productName" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="productCategory">Kategori</label>
          <select id="productCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="productBrand">Brand (opsional)</label>
          <select id="productBrand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">Tanpa brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="productMinStock">Batas stok menipis</label>
          <input id="productMinStock" type="number" min="0" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
          <div className="field-hint">Sistem akan menandai "Menipis" jika stok di bawah angka ini.</div>
        </div>
        <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetProduct, setSheetProduct] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, b] = await Promise.all([
        api.get('/products', { search, categoryId, page, limit }),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setProducts(p.data);
      setTotal(p.total ?? p.data.length);
      setCategories(c.data);
      setBrands(b.data);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function toggleActive(product) {
    try {
      await api.patch(`/products/${product.id}/active`, { isActive: !product.is_active });
      toast.success(product.is_active ? 'Barang dinonaktifkan.' : 'Barang diaktifkan kembali.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Hapus "${product.name}"? Riwayat transaksinya tetap tersimpan.`)) return;
    try {
      await api.del(`/products/${product.id}`);
      toast.success('Barang berhasil dihapus.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kelola Barang</h1>
          <p>{total} barang</p>
        </div>
        <button className="btn btn-primary" onClick={() => setSheetProduct(null)}>
          <PlusIcon width={16} height={16} /> Tambah Barang
        </button>
      </div>

      <div className="search-bar">
        <SearchIcon width={18} height={18} stroke="var(--ink-soft)" style={{ marginLeft: 4 }} />
        <input placeholder="Cari nama barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="chip-row">
        <button className={`chip ${categoryId === '' ? 'active' : ''}`} onClick={() => setCategoryId('')}>Semua</button>
        {categories.map((c) => (
          <button key={c.id} className={`chip ${categoryId === c.id ? 'active' : ''}`} onClick={() => setCategoryId(categoryId === c.id ? '' : c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada barang</h3>
          <p>Tambahkan barang pertama untuk mulai mencatat stok.</p>
          <button className="btn btn-primary" onClick={() => setSheetProduct(null)}>Tambah Barang</button>
        </div>
      ) : (
        <div className="list">
          {products.map((p) => (
            <div className="list-row" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <div className="list-row__title">
                  {p.name} {!p.is_active && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>Nonaktif</span>}
                </div>
                <div className="list-row__meta">{p.brand_name ? `${p.brand_name} · ` : ''}{p.category_name} · min. {p.minimum_stock}</div>
              </div>
              <div className="flex items-center gap-8">
                <button className="btn btn-secondary btn-sm" onClick={() => setSheetProduct(p)}>Ubah</button>
                <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(p)}>
                  {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-16">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Sebelumnya
          </button>
          <span className="text-sm muted">Hal. {page} / {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </button>
        </div>
      )}

      {sheetProduct !== undefined && (
        <ProductSheet
          product={sheetProduct}
          categories={categories}
          brands={brands}
          onClose={() => setSheetProduct(undefined)}
          onSaved={() => {
            setSheetProduct(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}
