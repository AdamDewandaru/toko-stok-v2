import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from './renderWithProviders';
import { installFetchMock, staffUser } from './mockApi';

import StaffDashboard from '../pages/staff/Dashboard';
import Profile from '../pages/staff/Profile';
import StockView from '../pages/StockView';
import HistoryView from '../pages/HistoryView';
import RecordChoice from '../pages/RecordChoice';
import RecordForm from '../pages/RecordForm';

describe('Halaman-halaman Staff', () => {
  beforeEach(() => installFetchMock({ meOverrides: staffUser() }));

  it('Dashboard staff menampilkan ringkasan toko sendiri', async () => {
    renderWithProviders(<StaffDashboard />, { route: '/staf', authed: true });
    expect(await screen.findByText(/Beranda/i)).toBeInTheDocument();
    expect(await screen.findByText(/Stok Menipis/i)).toBeInTheDocument();
    expect(await screen.findByText(/Perlu Perhatian/i)).toBeInTheDocument();
  });

  it('Profil menampilkan data akun dan form ubah password', async () => {
    renderWithProviders(<Profile />, { route: '/staf/profil', authed: true });
    expect(await screen.findByText(/Profil/i)).toBeInTheDocument();
    expect(await screen.findByText('Andi')).toBeInTheDocument();
    expect(screen.getByLabelText(/Password saat ini/i)).toBeInTheDocument();
  });

  it('Stok (Lihat Stok) merender tanpa error untuk staf', async () => {
    renderWithProviders(<StockView />, { route: '/staf/stok', authed: true });
    expect(await screen.findByText(/Stok Barang/i)).toBeInTheDocument();
  });

  it('Riwayat merender tanpa error untuk staf', async () => {
    renderWithProviders(<HistoryView />, { route: '/staf/riwayat', authed: true });
    expect(await screen.findByText(/Riwayat Transaksi/i)).toBeInTheDocument();
  });

  it('Pilihan Catat Transaksi menampilkan opsi Masuk/Keluar', async () => {
    renderWithProviders(<RecordChoice basePath="/staf/catat" />, { route: '/staf/catat', authed: true });
    expect(await screen.findByText(/Barang Masuk/i)).toBeInTheDocument();
    expect(await screen.findByText(/Barang Keluar/i)).toBeInTheDocument();
  });

  it('Form Catat Barang Masuk otomatis pakai toko staf sendiri (tanpa pilihan toko)', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/staf/catat/:type" element={<RecordForm historyPath="/staf/riwayat" />} />
      </Routes>,
      { route: '/staf/catat/masuk', authed: true }
    );
    expect(await screen.findByRole('heading', { name: 'Barang Masuk' })).toBeInTheDocument();
    expect(await screen.findByText('Sampoerna Mild 16')).toBeInTheDocument();
    // Staff should never see a store picker — backend forces their own store.
    expect(screen.queryByText(/^Toko$/i)).not.toBeInTheDocument();
  });

  it('Form Catat Barang Keluar tidak menampilkan opsi penyesuaian stok (khusus owner)', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/staf/catat/:type" element={<RecordForm historyPath="/staf/riwayat" />} />
      </Routes>,
      { route: '/staf/catat/keluar', authed: true }
    );
    expect(await screen.findByRole('heading', { name: 'Barang Keluar' })).toBeInTheDocument();
    expect(screen.queryByText(/penyesuaian stok/i)).not.toBeInTheDocument();
  });
});
