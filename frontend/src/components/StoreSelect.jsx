import { useStoreScope } from '../context/StoreScopeContext';

export default function StoreSelect() {
  const { activeStores, selectedStoreId, setSelectedStoreId } = useStoreScope();

  if (activeStores.length <= 1) return null;

  return (
    <select
      value={selectedStoreId}
      onChange={(e) => setSelectedStoreId(e.target.value)}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: '7px 12px',
        fontSize: 13,
        fontWeight: 700,
        background: 'white',
        color: 'var(--ink)',
      }}
    >
      <option value="all">Semua Toko</option>
      {activeStores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
