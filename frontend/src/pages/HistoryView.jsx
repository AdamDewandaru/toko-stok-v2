import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStoreScope } from '../context/StoreScopeContext';
import { TypeBadge } from '../components/StatusBadge';

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HistoryView() {
  const { user } = useAuth();
  const isOwner = user.role === 'owner';
  const scope = useStoreScope();

  const [type, setType] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const storeId = isOwner ? scope.selectedStoreId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/transactions', { storeId, type, page, limit });
      setRows(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [storeId, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [storeId, type]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Riwayat Transaksi</h1>
          <p>{total} transaksi tercatat</p>
        </div>
      </div>

      <div className="chip-row">
        <button className={`chip ${type === '' ? 'active' : ''}`} onClick={() => setType('')}>Semua</button>
        <button className={`chip ${type === 'IN' ? 'active' : ''}`} onClick={() => setType('IN')}>Masuk</button>
        <button className={`chip ${type === 'OUT' ? 'active' : ''}`} onClick={() => setType('OUT')}>Keluar</button>
      </div>

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada transaksi</h3>
          <p>Transaksi yang Anda catat akan muncul di sini.</p>
        </div>
      ) : (
        <div className="list">
          {rows.map((r) => (
            <div className="card" key={r.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <TypeBadge type={r.type} />
                  {r.is_adjustment ? <span className="badge badge-neutral">Penyesuaian</span> : null}
                </div>
                <span className="muted text-sm">{formatDate(r.transaction_date)}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                {r.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm" style={{ padding: '3px 0' }}>
                    <span>{it.name}</span>
                    <strong>{it.quantity}</strong>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-8" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                <span className="muted text-sm">{r.transaction_code}</span>
                <span className="muted text-sm">
                  {r.staff_name}{isOwner ? ` · ${r.store_name}` : ''}
                </span>
              </div>
              {r.notes && <div className="muted text-sm mt-8">"{r.notes}"</div>}
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
    </div>
  );
}
