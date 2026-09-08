import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowDownIcon, ArrowUpIcon, AlertIcon, ChevronRight } from '../../components/Icons';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/home'), api.get('/dashboard/low-stock')])
      .then(([home, low]) => {
        setData(home);
        setLowStock(low.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p className="muted">Memuat…</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Beranda</h1>
          <p>{data?.stores?.[0]?.name}</p>
        </div>
      </div>

      <div className="stat-grid">
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

      {lowStock.length > 0 && (
        <>
          <div className="section-title flex items-center gap-8">
            <AlertIcon width={16} height={16} stroke="var(--amber)" /> Perlu Perhatian
          </div>
          <div className="list">
            {lowStock.map((item) => (
              <div className="list-row" key={item.productId}>
                <div>
                  <div className="list-row__title">{item.productName}</div>
                  <div className="list-row__meta">Sisa {item.stock} (min. {item.minimumStock})</div>
                </div>
                <span className={`badge ${item.status === 'HABIS' ? 'badge-danger' : 'badge-warn'}`}>
                  {item.status === 'HABIS' ? 'Habis' : 'Menipis'}
                </span>
              </div>
            ))}
          </div>
          <Link to="/staf/stok" className="btn btn-secondary btn-block mt-16">
            Lihat Semua Stok
          </Link>
        </>
      )}
    </div>
  );
}
