export function StockStatusBadge({ status }) {
  const map = {
    AMAN: { cls: 'badge-good', text: 'Aman' },
    MENIPIS: { cls: 'badge-warn', text: 'Menipis' },
    HABIS: { cls: 'badge-danger', text: 'Habis' },
  };
  const conf = map[status] || map.AMAN;
  return <span className={`badge ${conf.cls}`}>{conf.text}</span>;
}

export function TypeBadge({ type }) {
  return type === 'IN' ? (
    <span className="badge badge-in">Masuk</span>
  ) : (
    <span className="badge badge-out">Keluar</span>
  );
}
