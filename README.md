# Toko Stok — Aplikasi Pencatatan Stok (V2)

Aplikasi pencatatan stok (bukan POS) untuk usaha dengan banyak toko. Owner
mengelola hingga 3 toko aktif, barang, dan staf secara terpusat. Staf hanya
mencatat barang masuk/keluar di toko tempat mereka ditugaskan. Tidak ada
harga, kasir, atau transaksi penjualan — murni pelacakan kuantitas stok.

Lihat `prd.md` untuk spesifikasi lengkap, dan bagian **#memory** di akhir
file itu untuk status pengerjaan terbaru (selesai / belum).

## Struktur folder

```
  backend/    Node.js + Express API, PostgreSQL via Knex
frontend/   React (Vite) — web app mobile-first
prd.md      Dokumen kebutuhan produk + catatan progres (#memory)
```

## Menjalankan Backend

Butuh Node.js 18+ dan PostgreSQL 14+.

```bash
cd backend
npm install
cp .env.example .env   # sudah ada .env contoh untuk dev lokal — sesuaikan
```

Buat database dan role PostgreSQL sesuai `.env` (default: database
`toko_stok_v2`, role `tokostok`), lalu jalankan migrasi dan seed data default:

```bash
npx knex migrate:latest
npx knex seed:run
```

Jalankan server:

```bash
npm run dev      # dengan nodemon, atau
npm start        # produksi
```

API akan aktif di `http://localhost:4000`. Cek `GET /health`.

### Deploy ke Supabase + Vercel

1. Buat project di Supabase, buka **Connect**, lalu salin connection string
  PostgreSQL dari **Session pooler**. Gunakan format itu sebagai `DATABASE_URL`.
2. Jalankan migrasi dan seed terhadap database Supabase dari komputer lokal:

```bash
cd backend
$env:DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:5432/postgres"
npx knex migrate:latest
npx knex seed:run
```

3. Deploy folder `backend` sebagai project Vercel. Tambahkan environment
  variables `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `MAX_STORES_PER_OWNER`,
  dan `DEFAULT_MIN_STOCK` untuk environment Production.
4. Deploy folder `frontend` sebagai project Vercel. Atur
  `VITE_API_URL=https://[URL-BACKEND-VERCEL]/api`, lalu lakukan redeploy.

`CORS_ORIGIN` harus berisi URL frontend Vercel, tanpa trailing slash. Untuk
  beberapa origin, pisahkan dengan koma.

### Uji end-to-end otomatis

Ada skrip yang menjalankan seluruh alur inti (daftar owner → buat toko →
buat staf → login staf → catat barang masuk/keluar → cek batas stok →
dashboard → laporan → guard peran) langsung terhadap kode backend tanpa
perlu server berjalan terpisah:

```bash
cd backend
node scripts/test-e2e.js
```

## Menjalankan Frontend

```bash
cd frontend
npm install
cp .env.example .env   # arahkan VITE_API_URL ke URL backend Anda
npm run dev
```

Buka `http://localhost:5173`. Alur awal: **Daftar sebagai Pemilik** →
tambah toko pertama → (opsional) tambah staf → masuk ke dashboard owner.

## Build produksi

```bash
cd frontend && npm run build   # hasil di frontend/dist
cd backend  && npm start
```

Deploy `frontend/dist` sebagai static site (Nginx, Vercel, dsb.) dan
`backend` sebagai layanan Node.js (PM2, Docker, dsb.) yang terhubung ke
PostgreSQL. Set `JWT_SECRET` yang kuat dan unik di lingkungan produksi.

## Keamanan & catatan teknis penting

- Password di-hash dengan bcrypt; sesi memakai JWT (7 hari, dapat diubah).
- **Rate limiting** pada login, register, dan lupa password (anti brute-force).
- **Lupa password** (khusus akun Owner) memakai pertanyaan keamanan yang
  diisi saat daftar — bukan email/SMS, karena tidak ada layanan pengirim
  terkonfigurasi. Staf tetap direset lewat menu Kelola Staf oleh owner.
- Setiap request staf dipaksa memakai `store_id` miliknya sendiri di
  backend (bukan dipercaya dari klien) — lihat `src/utils/storeScope.js`.
- Stok dihitung on-the-fly dari jumlah transaksi masuk dikurangi keluar
  (bukan kolom saldo yang bisa "nyasar" dari kenyataan).
- Laporan bisa diunduh dalam format **Excel (.xlsx)** dan **PDF** untuk
  Barang Masuk/Keluar; Stok Menipis punya unduhan PDF tersendiri.
- Ada **Log Aktivitas** (audit log) untuk owner di halaman Laporan,
  mencatat setiap transaksi stok berikut siapa yang melakukannya.
- Dependency `xlsx` (SheetJS) versi 0.18.5 punya advisory keamanan terkait
  *parsing* file tidak tepercaya — aplikasi ini hanya memakainya untuk
  *menulis* laporan dari data sendiri, jadi risikonya minim. Perbarui jika
  nanti menambah fitur impor `.xlsx`.

## Pengujian otomatis

Backend (jalankan semua skenario inti dalam satu proses, tanpa server
terpisah):

```bash
cd backend
node scripts/test-e2e.js   # atau: npm test
```

Frontend (Vitest + React Testing Library, merender tiap halaman dengan API
tiruan untuk menangkap error runtime lebih awal dari sekadar `npm run build`):

```bash
cd frontend
npm test
```

Catatan jujur: pengujian frontend ini memvalidasi bahwa komponen React
merender tanpa error dan menampilkan data API dengan benar — ini **bukan**
pengganti pengecekan visual manual di browser sungguhan (tampilan, CSS,
responsif di HP). Disarankan tetap coba klik-klik alur utama secara manual
sebelum dipakai produksi.
