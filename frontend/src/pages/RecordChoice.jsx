import { useNavigate } from 'react-router-dom';
import { ArrowDownIcon, ArrowUpIcon } from '../components/Icons';

export default function RecordChoice({ basePath }) {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Catat Transaksi</h1>
          <p>Pilih jenis transaksi yang ingin dicatat.</p>
        </div>
      </div>

      <div className="list">
        <button
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--line)', textAlign: 'left' }}
          onClick={() => navigate(`${basePath}/masuk`)}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowDownIcon stroke="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Barang Masuk</div>
            <div className="muted text-sm">Catat kiriman atau tambahan stok baru</div>
          </div>
        </button>

        <button
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--line)', textAlign: 'left' }}
          onClick={() => navigate(`${basePath}/keluar`)}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--rust-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowUpIcon stroke="var(--rust)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Barang Keluar</div>
            <div className="muted text-sm">Catat barang terjual atau keluar dari toko</div>
          </div>
        </button>
      </div>
    </div>
  );
}
