import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const StoreScopeContext = createContext(null);

export function StoreScopeProvider({ children }) {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [loadingStores, setLoadingStores] = useState(true);

  const reloadStores = useCallback(async () => {
    if (!user || user.role !== 'owner') {
      setLoadingStores(false);
      return;
    }
    setLoadingStores(true);
    try {
      const res = await api.get('/stores');
      setStores(res.data);
      if (res.data.length === 1) setSelectedStoreId(String(res.data[0].id));
    } finally {
      setLoadingStores(false);
    }
  }, [user]);

  useEffect(() => {
    reloadStores();
  }, [reloadStores]);

  const activeStores = stores.filter((s) => s.is_active);

  return (
    <StoreScopeContext.Provider
      value={{ stores, activeStores, selectedStoreId, setSelectedStoreId, reloadStores, loadingStores }}
    >
      {children}
    </StoreScopeContext.Provider>
  );
}

export function useStoreScope() {
  const ctx = useContext(StoreScopeContext);
  if (!ctx) throw new Error('useStoreScope must be used within StoreScopeProvider');
  return ctx;
}
