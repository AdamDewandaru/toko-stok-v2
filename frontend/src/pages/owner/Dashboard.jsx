import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useStoreScope } from '../../context/StoreScopeContext';
import { ArrowDownIcon, ArrowUpIcon, ChevronRight } from '../../components/Icons';

export default function OwnerDashboard() {
  const { selectedStoreId } = useStoreScope();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/dashboard/home', { storeId: selectedStoreId })
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedStoreId]);

  if (loading) return <div className="page"><p className="muted">Memuat…</p></div>;

  if (!data?.hasStores) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Belum ada toko</h3>
          <p>Tambahkan toko pertama Anda untuk mulai mencatat stok.</p>
          <Link to="/owner/toko" className="btn btn-primary">Tambah Toko</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ringkasan</h1>
          <p>{data.businessName || 'Usaha Anda'}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total Stok</div>
          <div className="stat-card__value">{data.totalStock.toLocaleString('id-ID')}</div>
        </div>
        <div className={`stat-card ${data.lowStockCount > 0 ? 'stat-card--warn' : ''}`}>
          <div className="stat-card__label">Stok Menipis</div>
          <div className="stat-card__value">{data.lowStockCount}</div>
        </div>
        <div className={`stat-card ${data.outOfStockCount > 0 ? 'stat-card--danger' : ''}`}>
          <div className="stat-card__label">Stok Habis</div>
          <div className="stat-card__value">{data.outOfStockCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Transaksi Hari Ini</div>
          <div className="stat-card__value">{data.transactionsToday}</div>
        </div>
      </div>

      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownIcon width={18} height={18} stroke="var(--green)" />
          </div>
          <div>
            <div className="muted text-sm">Masuk hari ini</div>
            <div style={{ fontWeight: 800 }}>{data.stockInToday.toLocaleString('id-ID')} pcs</div>
          </div>
        </div>
        <div className="flex items-center gap-12">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--rust-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpIcon width={18} height={18} stroke="var(--rust)" />
          </div>
          <div>
            <div className="muted text-sm">Keluar hari ini</div>
            <div style={{ fontWeight: 800 }}>{data.stockOutToday.toLocaleString('id-ID')} pcs</div>
          </div>
        </div>
      </div>

      {data.storeActivity.length > 0 && (
        <>
          <div className="section-title">Aktivitas Toko Hari Ini</div>
          <div className="list">
            {data.storeActivity.map((s) => (
              <div className="list-row" key={s.storeId}>
                <div>
                  <div className="list-row__title">{s.name}</div>
                  <div className="list-row__meta">{s.code}</div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="badge badge-neutral">{s.transactions} transaksi</span>
                  <ChevronRight />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
