import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './renderWithProviders';
import { installFetchMock } from './mockApi';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

describe('Halaman Login', () => {
  beforeEach(() => installFetchMock());

  it('menampilkan form login', async () => {
    renderWithProviders(<Login />, { route: '/masuk' });
    expect(await screen.findByText(/Masuk ke akun Anda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('menampilkan link lupa password dan daftar', async () => {
    renderWithProviders(<Login />, { route: '/masuk' });
    await screen.findByText(/Masuk ke akun Anda/i);
    expect(screen.getByText(/Lupa password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Daftar sebagai Pemilik/i)).toBeInTheDocument();
  });
});

describe('Halaman Register', () => {
  beforeEach(() => installFetchMock());

  it('menampilkan semua field wajib termasuk pertanyaan keamanan', async () => {
    renderWithProviders(<Register />, { route: '/daftar' });
    await screen.findByText(/Daftar sebagai Pemilik/i);
    expect(screen.getByLabelText(/Nama Anda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pertanyaan keamanan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jawaban rahasia/i)).toBeInTheDocument();
  });

  it('menolak submit jika konfirmasi password tidak sama', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { route: '/daftar' });
    await screen.findByText(/Daftar sebagai Pemilik/i);

    await user.type(screen.getByLabelText(/Nama Anda/i), 'Adam');
    await user.type(screen.getByLabelText(/Username/i), 'adam.owner');
    await user.type(screen.getByLabelText(/^Password$/i), 'rahasia123');
    await user.type(screen.getByLabelText(/Ulangi Password/i), 'beda123');
    await user.type(screen.getByLabelText(/Pertanyaan keamanan/i), 'Nama hewan?');
    await user.type(screen.getByLabelText(/Jawaban rahasia/i), 'Milo');
    await user.click(screen.getByRole('button', { name: /Buat Akun/i }));

    expect(await screen.findByText(/Konfirmasi password tidak sama/i)).toBeInTheDocument();
  });
});

describe('Halaman Lupa Password', () => {
  beforeEach(() => installFetchMock());

  it('alur 2 langkah: cari akun lalu tampilkan pertanyaan keamanan', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />, { route: '/lupa-password' });
    await screen.findByText(/Lupa Password/i);

    await user.type(screen.getByLabelText(/Username akun Pemilik/i), 'adam.owner');
    await user.click(screen.getByRole('button', { name: /Lanjut/i }));

    expect(await screen.findByText(/Nama hewan peliharaan pertama\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jawaban Anda/i)).toBeInTheDocument();
  });
});
