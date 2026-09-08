import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { useStoreScope } from '../../context/StoreScopeContext';
import { useToast } from '../../context/ToastContext';
import { DownloadIcon } from '../../components/Icons';

const PERIODS = [
  { value: 'today', label: 'Hari Ini' },
  { value: '7days', label: '7 Hari' },
  { value: 'thisMonth', label: 'Bulan Ini' },
  { value: 'lastMonth', label: 'Bulan Lalu' },
];

const TABS = [
  { key: 'summary', label: 'Ringkasan' },
  { key: 'movements', label: 'Barang Masuk/Keluar' },
  { key: 'lowstock', label: 'Stok Menipis' },
  { key: 'movers', label: 'Pergerakan Barang' },
  { key: 'performance', label: 'Performa Toko' },
  { key: 'auditlog', label: 'Log Aktivitas' },
];

export default function Reports() {
  const { selectedStoreId } = useStoreScope();
  const toast = useToast();
  const [tab, setTab] = useState('summary');
  const [period, setPeriod] = useState('thisMonth');
  const [movementType, setMovementType] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = selectedStoreId;
      if (tab === 'summary') {
        setData(await api.get('/reports/stock-summary', { storeId }));
      } else if (tab === 'movements') {
        setData(await api.get('/reports/movements', { storeId, period, type: movementType, limit: 100 }));
      } else if (tab === 'lowstock') {
        setData(await api.get('/reports/low-stock', { storeId }));
      } else if (tab === 'movers') {
        setData(await api.get('/reports/top-movers', { storeId, period, type: 'OUT', limit: 10 }));
      } else if (tab === 'performance') {
        setData(await api.get('/reports/store-performance', { period }));
      } else if (tab === 'auditlog') {
        setData(await api.get('/reports/audit-log', { page: 1, limit: 30 }));
      }
    } finally {
      setLoading(false);
    }
  }, [tab, period, movementType, selectedStoreId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport(format) {
    setExporting(true);
    try {
      if (format === 'xlsx') {
        await api.download(
          '/reports/export/movements',
          { storeId: selectedStoreId, period, type: movementType },
          `laporan-stok-${period}.xlsx`
        );
      } else {
        await api.download(
          '/reports/export/movements-pdf',
          { storeId: selectedStoreId, period, type: movementType },
          `laporan-stok-${period}.pdf`
        );
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportLowStockPdf() {
    setExporting(true);
    try {
      await api.download('/reports/export/low-stock-pdf', { storeId: selectedStoreId }, 'laporan-stok-menipis.pdf');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Laporan</h1>
          <p>Pantau performa stok dan toko Anda.</p>
        </div>
      </div>

      <div className="chip-row">
        {TABS.map((t) => (
          <button key={t.key} className={`chip ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'movements' || tab === 'movers' || tab === 'performance') && (
        <div className="chip-row">
          {PERIODS.map((p) => (
            <button key={p.value} className={`chip ${period === p.value ? 'active' : ''}`} onClick={() => setPeriod(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'movements' && (
        <div className="flex items-center justify-between mt-8" style={{ marginBottom: 14 }}>
          <div className="flex gap-8">
            <button className={`chip ${movementType === '' ? 'active' : ''}`} onClick={() => setMovementType('')}>Semua</button>
            <button className={`chip ${movementType === 'IN' ? 'active' : ''}`} onClick={() => setMovementType('IN')}>Masuk</button>
            <button className={`chip ${movementType === 'OUT' ? 'active' : ''}`} onClick={() => setMovementType('OUT')}>Keluar</button>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-secondary btn-sm" disabled={exporting} onClick={() => handleExport('xlsx')}>
              <DownloadIcon width={15} height={15} /> Excel
            </button>
            <button className="btn btn-secondary btn-sm" disabled={exporting} onClick={() => handleExport('pdf')}>
              <DownloadIcon width={15} height={15} /> PDF
            </button>
          </div>
        </div>
      )}

      {tab === 'lowstock' && (
        <div className="flex justify-between mt-8" style={{ marginBottom: 14 }}>
          <div />
          <button className="btn btn-secondary btn-sm" disabled={exporting} onClick={handleExportLowStockPdf}>
            <DownloadIcon width={15} height={15} /> Unduh PDF
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted text-sm">Memuat…</p>
      ) : (
        <>
          {tab === 'summary' && data && (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card__label">Jenis Barang Aktif</div>
                <div className="stat-card__value">{data.data.totalProducts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">Total Stok</div>
                <div className="stat-card__value">{data.data.totalStock.toLocaleString('id-ID')}</div>
              </div>
              <div className={`stat-card ${data.data.lowStock > 0 ? 'stat-card--warn' : ''}`}>
                <div className="stat-card__label">Stok Menipis</div>
                <div className="stat-card__value">{data.data.lowStock}</div>
              </div>
              <div className={`stat-card ${data.data.outOfStock > 0 ? 'stat-card--danger' : ''}`}>
                <div className="stat-card__label">Stok Habis</div>
                <div className="stat-card__value">{data.data.outOfStock}</div>
              </div>
            </div>
          )}

          {tab === 'movements' && data && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th><th>Kode</th><th>Jenis</th><th>Toko</th><th>Barang</th><th>Jumlah</th><th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((r, i) => (
                    <tr key={i}>
                      <td>{new Date(r.transaction_date).toLocaleDateString('id-ID')}</td>
                      <td>{r.transaction_code}</td>
                      <td>{r.type === 'IN' ? 'Masuk' : 'Keluar'}</td>
                      <td>{r.store_name}</td>
                      <td>{r.product_name}</td>
                      <td>{r.quantity}</td>
                      <td>{r.staff_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.data.length === 0 && <p className="muted text-sm" style={{ padding: 16 }}>Tidak ada data pada periode ini.</p>}
            </div>
          )}

          {tab === 'lowstock' && data && (
            <div className="list">
              {data.data.length === 0 && <p className="muted text-sm">Semua stok dalam kondisi aman.</p>}
              {data.data.map((r, i) => (
                <div className="list-row" key={i}>
                  <div>
                    <div className="list-row__title">{r.productName}</div>
                    <div className="list-row__meta">{r.storeName} · min. {r.minimumStock}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <strong>{r.stock}</strong>
                    <span className={`badge ${r.status === 'HABIS' ? 'badge-danger' : 'badge-warn'}`}>
                      {r.status === 'HABIS' ? 'Habis' : 'Menipis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'movers' && data && (
            <div className="list">
              {data.data.length === 0 && <p className="muted text-sm">Belum ada data pergerakan barang.</p>}
              {data.data.map((r, i) => (
                <div className="list-row" key={i}>
                  <div className="list-row__title">{i + 1}. {r.name}</div>
                  <strong>{r.total.toLocaleString('id-ID')} pcs</strong>
                </div>
              ))}
            </div>
          )}

          {tab === 'performance' && data && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Toko</th><th>Masuk</th><th>Keluar</th><th>Transaksi</th></tr>
                </thead>
                <tbody>
                  {data.data.map((r) => (
                    <tr key={r.storeId}>
                      <td>{r.name}</td>
                      <td>{r.in.toLocaleString('id-ID')}</td>
                      <td>{r.out.toLocaleString('id-ID')}</td>
                      <td>{r.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'auditlog' && data && (
            <div className="list">
              {data.data.length === 0 && <p className="muted text-sm">Belum ada aktivitas tercatat.</p>}
              {data.data.map((log) => (
                <div className="list-row" key={log.id}>
                  <div>
                    <div className="list-row__title">
                      {log.action === 'stock.in' ? 'Barang Masuk' : log.action === 'stock.out' ? 'Barang Keluar' : log.action}
                    </div>
                    <div className="list-row__meta">
                      {log.user_name} ({log.user_role === 'owner' ? 'Pemilik' : 'Staf'}) ·{' '}
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                  {log.meta?.isAdjustment && <span className="badge badge-neutral">Penyesuaian</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
