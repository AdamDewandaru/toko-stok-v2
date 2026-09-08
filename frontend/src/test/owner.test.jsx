import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from './renderWithProviders';
import { installFetchMock, ownerUser } from './mockApi';

import OwnerDashboard from '../pages/owner/Dashboard';
import Products from '../pages/owner/Products';
import Stores from '../pages/owner/Stores';
import StaffPage from '../pages/owner/Staff';
import Reports from '../pages/owner/Reports';
import StockView from '../pages/StockView';
import HistoryView from '../pages/HistoryView';
import RecordChoice from '../pages/RecordChoice';
import RecordForm from '../pages/RecordForm';

describe('Halaman-halaman Owner', () => {
  beforeEach(() => installFetchMock({ meOverrides: ownerUser() }));

  it('Dashboard owner menampilkan ringkasan', async () => {
    renderWithProviders(<OwnerDashboard />, { route: '/owner', authed: true });
    expect(await screen.findByText(/Ringkasan/i)).toBeInTheDocument();
    expect(await screen.findByText(/Stok Menipis/i)).toBeInTheDocument();
  });

  it('Kelola Barang menampilkan daftar produk', async () => {
    renderWithProviders(<Products />, { route: '/owner/barang', authed: true });
    expect(await screen.findByText(/Kelola Barang/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sampoerna Mild 16/i)).toBeInTheDocument();
  });

  it('Kelola Toko menampilkan daftar toko dan batas maksimal', async () => {
    renderWithProviders(<Stores />, { route: '/owner/toko', authed: true });
    expect(await screen.findByText(/Kelola Toko/i)).toBeInTheDocument();
    expect(await screen.findByText(/Berkah Jaya 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/dari 3 toko aktif/i)).toBeInTheDocument();
  });

  it('Kelola Staf menampilkan daftar staf', async () => {
    renderWithProviders(<StaffPage />, { route: '/owner/staf', authed: true });
    expect(await screen.findByText(/Kelola Staf/i)).toBeInTheDocument();
    expect(await screen.findByText('Andi')).toBeInTheDocument();
  });

  it('Laporan menampilkan tab Ringkasan secara default', async () => {
    renderWithProviders(<Reports />, { route: '/owner/laporan', authed: true });
    expect(await screen.findByText(/Laporan/i)).toBeInTheDocument();
    expect(await screen.findByText(/Jenis Barang Aktif/i)).toBeInTheDocument();
  });

  it('Stok (Lihat Stok) menampilkan barang dengan status', async () => {
    renderWithProviders(<StockView />, { route: '/owner/stok', authed: true });
    expect(await screen.findByText(/Stok Barang/i)).toBeInTheDocument();
  });

  it('Riwayat menampilkan transaksi', async () => {
    renderWithProviders(<HistoryView />, { route: '/owner/riwayat', authed: true });
    expect(await screen.findByText(/Riwayat Transaksi/i)).toBeInTheDocument();
  });

  it('Pilihan Catat Transaksi menampilkan opsi Masuk/Keluar', async () => {
    renderWithProviders(<RecordChoice basePath="/owner/catat" />, { route: '/owner/catat', authed: true });
    expect(await screen.findByText(/Barang Masuk/i)).toBeInTheDocument();
    expect(await screen.findByText(/Barang Keluar/i)).toBeInTheDocument();
  });

  it('Form Catat Barang Masuk merender pilihan barang setelah toko dipilih', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/owner/catat/:type" element={<RecordForm historyPath="/owner/riwayat" />} />
      </Routes>,
      { route: '/owner/catat/masuk', authed: true }
    );
    expect(await screen.findByRole('heading', { name: 'Barang Masuk' })).toBeInTheDocument();
    // Owner has 2+ active stores in this fixture, so a store must be picked first.
    await user.selectOptions(await screen.findByLabelText('Toko'), '1');
    expect(await screen.findByText('Sampoerna Mild 16')).toBeInTheDocument();
  });

  it('Form Catat Barang Keluar merender pilihan barang', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/owner/catat/:type" element={<RecordForm historyPath="/owner/riwayat" />} />
      </Routes>,
      { route: '/owner/catat/keluar', authed: true }
    );
    expect(await screen.findByRole('heading', { name: 'Barang Keluar' })).toBeInTheDocument();
  });
});
