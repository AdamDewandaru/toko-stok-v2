# PRD — Toko Madura: Buku Stok Digital

## 1. Ringkasan Produk

**Toko Madura — Buku Stok Digital** adalah aplikasi pencatatan stok berbasis web yang dirancang untuk mengelola persediaan beberapa toko secara terpusat.

Aplikasi memungkinkan staff toko mencatat **stok masuk** dan **stok keluar**, sedangkan owner/juragan dapat memantau stok seluruh toko, melihat transaksi, mendapatkan peringatan stok tipis, serta mengelola daftar barang.

Aplikasi dibangun dengan pendekatan **multi-perangkat**. Data utama dapat disimpan di **Firebase Firestore** sehingga perubahan transaksi dan produk dapat tersinkron secara real-time antarperangkat. Jika Firebase belum dikonfigurasi, aplikasi memiliki fallback menggunakan `localStorage`.

---

## 2. Tujuan Produk

### Tujuan utama
- Mengurangi pencatatan stok secara manual.
- Memusatkan data stok dari beberapa cabang/toko.
- Mempermudah staff mencatat barang masuk dan keluar.
- Memberikan owner gambaran stok seluruh toko.
- Memberikan peringatan ketika stok barang berada di bawah batas minimum.
- Menyediakan daftar transaksi sebagai buku besar digital.
- Memungkinkan pengelolaan master barang tanpa mengubah data transaksi lama.

### Masalah yang ingin diselesaikan
- Pencatatan stok manual sulit dipantau antar-toko.
- Owner membutuhkan cara cepat untuk melihat kondisi stok.
- Riwayat transaksi perlu tersimpan dan dapat dilihat kembali.
- Daftar barang dapat berubah sehingga diperlukan fitur tambah, ubah, dan hapus barang.

---

## 3. Target Pengguna

| Role | Pengguna | Kebutuhan |
|---|---|---|
| Staff | Penjaga/perangkat masing-masing toko | Mencatat stok masuk dan stok keluar |
| Owner | Juragan/pemilik usaha | Memantau seluruh toko, stok, transaksi, dan master barang |

---

## 4. Struktur Toko

Implementasi saat ini menyediakan satu jaringan toko:

**Berkah Jaya**
- Berkah Jaya 1
- Berkah Jaya 2
- Berkah Jaya 3
- Berkah Jaya 4

### Kode perangkat

| Kode | Role | Akses |
|---|---|---|
| `BJ1` | Staff | Berkah Jaya 1 |
| `BJ2` | Staff | Berkah Jaya 2 |
| `BJ3` | Staff | Berkah Jaya 3 |
| `BJ4` | Staff | Berkah Jaya 4 |
| `OWNER` | Owner | Semua toko |

> Catatan: README proyek menyebut dukungan 3+ toko, tetapi implementasi kode saat ini hanya mendefinisikan **4 toko Berkah Jaya**.

---

## 5. Fitur Utama

### 5.1 Login Perangkat

Pengguna masuk menggunakan kode perangkat.

#### Staff
- Memasukkan atau memilih kode `BJ1` sampai `BJ4`.
- Setelah masuk, perangkat terkunci pada toko yang sesuai.
- Staff tidak diberi pilihan untuk berpindah ke toko lain.

#### Owner
- Masuk menggunakan kode `OWNER`.
- Mendapat akses monitoring seluruh toko.
- Dapat memilih cakupan data: semua toko atau toko tertentu.

#### Session
Session login disimpan di browser menggunakan `localStorage`.

#### Batasan saat ini
Login bukan autentikasi akun/password berbasis server. Kode akses berada di frontend sehingga mekanisme ini lebih tepat dianggap sebagai **device access code**, bukan sistem keamanan autentikasi penuh.

---

## 6. Modul Staff

### 6.1 Pemilihan Toko
Jika perangkat tidak dikunci ke toko, staff dapat memilih toko.

Pada implementasi saat ini, perangkat staff dikunci berdasarkan kode login sehingga bagian pemilihan toko tidak menjadi pilihan utama.

### 6.2 Pemilihan Kategori

Barang dikelompokkan menjadi:

1. **Rokok**
2. **Sembako**
3. **Makanan & Minuman**

### 6.3 Pemilihan Barang

Staff memilih produk dari daftar berdasarkan kategori.

Produk diurutkan berdasarkan brand dan nama.

### 6.4 Pencatatan Stok

Staff dapat memilih jenis transaksi:

- **Stok Masuk**
- **Stok Keluar**

Jumlah barang diatur menggunakan tombol:
- `−` untuk mengurangi jumlah
- `+` untuk menambah jumlah

Jumlah minimum yang dapat dicatat adalah **1**.

### 6.5 Simpan Transaksi

Tombol **Catat ke Nota** membuat transaksi baru yang berisi informasi utama:

```text
id
storeId
productId
type
qty
ts
```

Setelah berhasil dicatat, UI memberikan feedback **"Tercatat"**.

### 6.6 Riwayat Transaksi Staff

Staff dapat melihat hingga **6 transaksi terbaru** untuk toko perangkat tersebut.

Informasi yang ditampilkan:
- Nomor nota
- Nama toko
- Waktu transaksi
- Nama barang
- Jumlah stok masuk/keluar

---

## 7. Modul Owner / Juragan

### 7.1 Cakupan Monitoring

Owner dapat memilih:

- **Semua toko**
- Berkah Jaya 1
- Berkah Jaya 2
- Berkah Jaya 3
- Berkah Jaya 4

Perubahan cakupan langsung mengubah perhitungan statistik dan stok.

### 7.2 Statistik Stok

Owner dapat melihat:

- Total stok masuk
- Total stok keluar

Nilai dihitung berdasarkan transaksi pada cakupan toko yang sedang dipilih.

### 7.3 Peringatan Stok Tipis

Sistem menggunakan batas minimum:

**5 pcs**

Barang dengan stok:
- `< 5 pcs`
- dan stok tidak negatif

akan dimasukkan ke daftar peringatan.

Jika tidak ada barang yang memenuhi kondisi, sistem menampilkan pesan bahwa stok masih aman.

### 7.4 Ringkasan Stok Per Barang

Stok saat ini dihitung berdasarkan seluruh transaksi:

```text
Stok = Total Stok Masuk - Total Stok Keluar
```

Data ditampilkan berdasarkan kategori:
- Rokok
- Sembako
- Makanan & Minuman

Setiap barang divisualisasikan menggunakan bar stok.

Sistem juga dapat menunjukkan stok negatif apabila transaksi keluar melebihi transaksi masuk.

### 7.5 Buku Besar Transaksi

Owner dapat melihat seluruh transaksi berdasarkan cakupan yang dipilih.

Buku besar menampilkan:
- Jumlah catatan
- Toko
- Barang
- Waktu
- Jenis transaksi
- Jumlah transaksi

Daftar transaksi dapat di-scroll.

---

## 8. Modul Kelola Barang

Fitur **Kelola Barang** hanya tersedia untuk owner.

### 8.1 Tambah Barang

Owner dapat menambahkan barang baru dengan:
- Nama barang
- Kategori
- Brand

Nama barang wajib diisi.

### 8.2 Ubah Barang

Owner dapat mengubah:
- Nama
- Kategori
- Brand

### 8.3 Hapus Barang

Owner dapat menghapus barang setelah konfirmasi.

Penghapusan barang **tidak menghapus transaksi lama**. Data transaksi sebelumnya tetap tersimpan menggunakan `productId`.

### 8.4 Kategori

Kategori default:

| ID | Nama |
|---|---|
| `rokok` | Rokok |
| `sembako` | Sembako |
| `makanan` | Makanan & Minuman |

### 8.5 Brand

Brand default:
- Sampoerna
- Djarum
- Gudang Garam
- Gajah Baru
- JTI
- BAT
- Wismilak
- Umum / Tanpa Brand

---

## 9. Produk Default

Aplikasi memiliki daftar produk default yang dikategorikan sebagai produk khas toko Madura, terutama:
- Produk rokok berdasarkan brand.
- Produk sembako.
- Produk makanan dan minuman.

Jika Firestore belum memiliki collection `products`, aplikasi melakukan seed terhadap daftar produk default.

Daftar produk default dapat dikembangkan melalui modul Kelola Barang.

---

## 10. Arsitektur Sistem

```text
┌─────────────────────────────┐
│        Browser / HP         │
│      React Web App          │
├─────────────────────────────┤
│ AppRoot                     │
│ ├─ Login Device             │
│ └─ Session localStorage     │
│                             │
│ TokoStokApp                 │
│ ├─ StaffView                │
│ ├─ OwnerView                │
│ └─ KelolaBarang             │
├─────────────────────────────┤
│ Custom Hooks                │
│ ├─ useTransactions          │
│ └─ useProducts              │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
 Firebase Firestore   localStorage
   (mode cloud)       (fallback)
```

---

## 11. Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | React 18 |
| Build Tool | Vite 5 |
| Database Cloud | Firebase Firestore |
| Icon | Lucide React |
| Penyimpanan fallback | localStorage |
| Bahasa | JavaScript / JSX |
| Styling | Inline CSS / React styles |
| Font UI | Manrope |
| Font heading | Fraunces |

---

## 12. Struktur Data

### 12.1 Collection `products`

Contoh struktur:

```json
{
  "name": "Sampoerna Mild 16",
  "category": "rokok",
  "brand": "sampoerna"
}
```

ID dokumen digunakan sebagai `productId`.

### 12.2 Collection `transactions`

Contoh struktur:

```json
{
  "id": "timestamp-random",
  "storeId": "bj-1",
  "productId": "default-1",
  "type": "masuk",
  "qty": 10,
  "ts": 1750000000000
}
```

### 12.3 Relasi konseptual

```text
STORE
  │
  └──< TRANSACTION >── PRODUCT
```

Satu toko memiliki banyak transaksi dan satu produk dapat muncul pada banyak transaksi.

---

## 13. Sinkronisasi Data

### Mode Cloud

Jika Firebase terkonfigurasi:
- Produk dibaca dari Firestore secara real-time.
- Transaksi dibaca dari Firestore secara real-time.
- Penambahan transaksi disimpan ke Firestore.
- Penambahan/perubahan/penghapusan produk disimpan ke Firestore.
- `onSnapshot()` digunakan untuk menerima perubahan data secara real-time.

### Mode Lokal

Jika Firebase tidak dikonfigurasi:
- Transaksi disimpan pada `localStorage`.
- Produk disimpan pada `localStorage`.
- Produk default digunakan sebagai data awal.

---

## 14. Alur Utama Staff

```text
Mulai
  ↓
Masukkan kode perangkat
  ↓
Validasi kode
  ↓
Kode BJ1–BJ4?
  ↓ Ya
Masuk sebagai Staff
  ↓
Toko terkunci
  ↓
Pilih kategori
  ↓
Pilih barang
  ↓
Pilih Stok Masuk / Stok Keluar
  ↓
Atur jumlah
  ↓
Catat ke Nota
  ↓
Simpan transaksi
  ↓
Tampilkan riwayat terbaru
```

---

## 15. Alur Utama Owner

```text
Mulai
  ↓
Masukkan kode OWNER
  ↓
Masuk sebagai Owner
  ↓
Pilih cakupan toko
  ↓
Sistem mengambil transaksi
  ↓
Hitung stok
  ↓
Hitung stok masuk & keluar
  ↓
Cek stok < 5 pcs
  ↓
Tampilkan dashboard
  ↓
Owner dapat membuka Kelola Barang
```

---

## 16. Aturan Bisnis

### RB-01 — Akses Staff
Kode `BJ1`–`BJ4` hanya terkait dengan toko masing-masing.

### RB-02 — Akses Owner
Kode `OWNER` dapat melihat seluruh toko.

### RB-03 — Stok Masuk
Transaksi `masuk` menambah stok:

```text
stok baru = stok lama + qty
```

### RB-04 — Stok Keluar
Transaksi `keluar` mengurangi stok:

```text
stok baru = stok lama - qty
```

### RB-05 — Stok Minimum
Barang dianggap stok tipis apabila:

```text
0 <= stok < 5
```

### RB-06 — Jumlah Transaksi
Qty minimal yang dapat dicatat adalah `1`.

### RB-07 — Produk
Nama barang wajib diisi saat tambah atau ubah produk.

### RB-08 — Riwayat
Menghapus produk tidak menghapus transaksi yang pernah menggunakan produk tersebut.

### RB-09 — Nomor Nota
Nomor nota ditampilkan berdasarkan posisi transaksi dalam daftar, bukan nomor invoice permanen yang disimpan sebagai field database.

---

## 17. Non-Functional Requirements

### Responsiveness
Aplikasi dirancang dengan layout sempit berorientasi mobile dan tetap dapat digunakan melalui browser desktop.

### Real-time
Dalam mode Firebase, perubahan data di Firestore diterima secara real-time melalui listener `onSnapshot`.

### Availability
Aplikasi tetap dapat berjalan secara lokal ketika Firebase belum dikonfigurasi.

### Usability
Alur staff dibuat sederhana dengan pola tiga langkah:
1. Pilih barang
2. Pilih jenis transaksi
3. Tentukan jumlah

### Performance
Aplikasi menggunakan React hooks dan `useMemo` untuk membantu menghindari perhitungan ulang data yang tidak diperlukan.

---

## 18. UI/UX

### Gaya visual
- Dark mode sebagai tampilan utama.
- Warna aksen turquoise.
- Panel bertingkat dengan border tipis.
- Tombol besar dan mudah disentuh.
- Layout mobile-first.
- Animasi ringan pada transaksi baru.

### Warna konseptual
- Turquoise: aksi utama / status aktif.
- Hijau: stok masuk / kondisi baik.
- Merah: stok keluar / peringatan.
- Kuning: status peringatan.

---

## 19. Struktur Proyek

```text
toko-madura-stok-app/
├── src/
│   ├── AppRoot.jsx
│   ├── firebase.js
│   ├── main.jsx
│   ├── toko-madura-stok.jsx
│   ├── useProducts.js
│   └── useTransactions.js
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── TODO.md
```

### Tanggung jawab file

**`main.jsx`**
- Entry point React.
- Merender `AppRoot`.

**`AppRoot.jsx`**
- Login perangkat.
- Validasi kode akses.
- Session browser.
- Logout.

**`toko-madura-stok.jsx`**
- UI utama aplikasi.
- Staff view.
- Owner view.
- Dashboard stok.
- Buku besar transaksi.
- Kelola barang.

**`useProducts.js`**
- Data produk.
- Sinkronisasi produk.
- CRUD produk.
- Produk default.

**`useTransactions.js`**
- Membaca transaksi.
- Menambahkan transaksi.
- Sinkronisasi transaksi real-time.

**`firebase.js`**
- Inisialisasi Firebase.
- Menyediakan koneksi Firestore.

---

## 20. Keamanan Saat Ini

Implementasi saat ini masih menggunakan pendekatan sederhana.

Hal penting yang perlu diperhatikan:

1. Kode `BJ1`–`BJ4` dan `OWNER` berada di frontend.
2. Session hanya disimpan di `localStorage`.
3. README proyek menggunakan contoh Firestore Rules yang mengizinkan read/write tanpa autentikasi:
   ```text
   allow read, write: if true;
   ```
4. Dengan rules seperti itu, siapa pun yang mengetahui project Firebase berpotensi mengakses database melalui client/API.

### Rekomendasi untuk produksi

- Gunakan Firebase Authentication.
- Gunakan custom claims atau role-based access control.
- Batasi akses staff berdasarkan `storeId`.
- Batasi CRUD produk hanya untuk owner.
- Jangan menggunakan Firestore Rules `allow read, write: if true` pada produksi.
- Validasi data transaksi di server/security rules.
- Pertimbangkan audit log untuk perubahan master barang.

---

## 21. Acceptance Criteria

### Login
- [ ] `BJ1` masuk sebagai Staff Berkah Jaya 1.
- [ ] `BJ2` masuk sebagai Staff Berkah Jaya 2.
- [ ] `BJ3` masuk sebagai Staff Berkah Jaya 3.
- [ ] `BJ4` masuk sebagai Staff Berkah Jaya 4.
- [ ] `OWNER` masuk sebagai Owner.
- [ ] Kode tidak valid menampilkan pesan error.
- [ ] Session bertahan setelah refresh browser.
- [ ] Logout menghapus session.

### Staff
- [ ] Staff dapat memilih kategori.
- [ ] Staff dapat memilih barang.
- [ ] Staff dapat memilih stok masuk.
- [ ] Staff dapat memilih stok keluar.
- [ ] Staff dapat menambah/mengurangi jumlah.
- [ ] Qty tidak dapat kurang dari 1.
- [ ] Transaksi tersimpan.
- [ ] Transaksi terbaru muncul di riwayat.
- [ ] Staff hanya dapat mencatat transaksi untuk toko yang terkait dengan perangkat.

### Owner
- [ ] Owner dapat melihat semua toko.
- [ ] Owner dapat memilih toko tertentu.
- [ ] Total stok masuk berubah sesuai cakupan.
- [ ] Total stok keluar berubah sesuai cakupan.
- [ ] Stok barang dihitung dari transaksi.
- [ ] Barang di bawah 5 pcs muncul sebagai peringatan.
- [ ] Buku besar transaksi dapat dilihat.
- [ ] Owner dapat membuka modul Kelola Barang.

### Kelola Barang
- [ ] Owner dapat menambah barang.
- [ ] Owner dapat mengubah barang.
- [ ] Owner dapat menghapus barang.
- [ ] Kategori tersimpan.
- [ ] Brand tersimpan.
- [ ] Transaksi lama tetap tersimpan setelah produk dihapus.

### Firebase
- [ ] Produk tersinkron real-time.
- [ ] Transaksi tersinkron real-time.
- [ ] Aplikasi memiliki fallback localStorage ketika Firebase belum tersedia.

---

## 22. Scope MVP Saat Ini

### Sudah tersedia
- Login berbasis kode perangkat.
- Role Staff dan Owner.
- 4 toko Berkah Jaya.
- Pencatatan stok masuk.
- Pencatatan stok keluar.
- Riwayat transaksi.
- Monitoring semua toko.
- Monitoring toko tertentu.
- Perhitungan stok.
- Peringatan stok minimum.
- Kelola produk.
- Kategori dan brand.
- Firebase Firestore.
- Real-time synchronization.
- Fallback localStorage.
- Responsive/mobile-oriented UI.

### Belum tersedia / dapat menjadi pengembangan berikutnya
- Autentikasi akun yang sebenarnya.
- Manajemen user/staff dari dashboard.
- Penambahan toko secara dinamis.
- Transfer stok antar-toko.
- Harga beli dan harga jual.
- Nilai rupiah total persediaan.
- Supplier.
- Pembelian/penerimaan barang yang lebih detail.
- Laporan harian/mingguan/bulanan.
- Export Excel/PDF.
- Pencarian barang.
- Filter transaksi berdasarkan tanggal.
- Edit atau pembatalan transaksi.
- Audit log.
- Notifikasi stok otomatis.
- Barcode scanner.
- PWA/offline sync yang benar-benar mendukung sinkronisasi saat koneksi terputus.

---

## 23. Prioritas Pengembangan

### P0 — Keamanan & Data
1. Firebase Authentication.
2. Firestore Security Rules berbasis role/store.
3. Validasi transaksi.
4. Audit log.

### P1 — Operasional
1. Filter transaksi berdasarkan tanggal.
2. Search barang.
3. Laporan stok.
4. Export Excel/PDF.
5. Manajemen toko.

### P2 — Efisiensi
1. Barcode scanner.
2. Transfer stok antar-toko.
3. Supplier.
4. Harga dan nilai persediaan.
5. Notifikasi stok.

### P3 — Advanced
1. Analitik penjualan/stok.
2. Forecast kebutuhan stok.
3. Dashboard bisnis.
4. PWA dengan offline queue dan conflict resolution.

---

## 24. Kesimpulan

Toko Madura — Buku Stok Digital merupakan MVP aplikasi manajemen stok multi-toko yang berfokus pada pencatatan stok masuk/keluar dan monitoring persediaan oleh owner.

Fondasi teknis saat ini sudah mencakup React, Firebase Firestore, real-time synchronization, role sederhana, pengelolaan produk, serta perhitungan stok berbasis transaksi.

Untuk penggunaan produksi, prioritas terbesar bukan menambah banyak fitur, melainkan **memperkuat autentikasi, otorisasi Firestore, validasi transaksi, dan audit data**. Setelah fondasi tersebut aman, fitur laporan, pencarian, barcode, transfer stok, dan analitik dapat dikembangkan di atas arsitektur yang sudah ada.


---

# 25. Arah Baru Produk — Rebuild Aplikasi V2

## 25.1 Keputusan Utama

Aplikasi **Toko Madura — Buku Stok Digital** akan **dibangun ulang (rebuild) dari awal** berdasarkan kebutuhan operasional yang sudah ditemukan pada versi sebelumnya.

Versi lama digunakan sebagai referensi untuk:
- memahami alur bisnis;
- mempertahankan konsep stok masuk dan stok keluar;
- mempertahankan kebutuhan multi-toko;
- mempertahankan dashboard owner;
- mempertahankan master barang;
- mengevaluasi kekurangan UI/UX;
- mengevaluasi struktur database dan keamanan.

**Versi lama tidak dijadikan fondasi kode utama.** Rebuild ditujukan untuk menghasilkan arsitektur, database, UI/UX, dan alur aplikasi yang lebih terstruktur dan siap dikembangkan.

### Prinsip rebuild

1. **Database SQL menjadi sumber data utama.**
2. **UI/UX dibuat untuk orang awam**, bukan untuk pengguna teknis.
3. **Laporan diperbaiki menjadi modul bisnis yang benar-benar berguna.**
4. Sistem dibuat modular agar fitur dapat dikembangkan tanpa merombak seluruh aplikasi.
5. Hak akses dibuat berdasarkan role.
6. Data transaksi harus memiliki histori yang jelas dan dapat diaudit.
7. Sistem harus siap dikembangkan dari satu toko menjadi beberapa toko.

---

# 26. Perubahan Database — Firebase ke SQL

## 26.1 Keputusan Teknologi

Database utama pada aplikasi V2 akan dipindahkan dari **Firebase Firestore** ke **SQL relational database**.

Database yang direkomendasikan:

**PostgreSQL**

Alasan:
- cocok untuk aplikasi CRUD dan transaksi stok;
- relasi antar data lebih jelas;
- mudah digunakan bersama Laravel/PHP;
- mudah dikelola menggunakan phpMyAdmin;
- cocok untuk hosting umum;
- mendukung transaksi database;
- lebih mudah membuat laporan menggunakan SQL query;
- struktur data lebih terkontrol dibanding penyimpanan dokumen bebas.

## 26.2 Arsitektur V2

```text
┌─────────────────────────────┐
│          User / Staff       │
│        Smartphone / PC      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Web Application      │
│      Responsive UI/UX       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Backend API        │
│   Authentication & Business │
│           Logic             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          PostgreSQL         │
│       Relational SQL DB     │
└─────────────────────────────┘
```

Frontend tidak boleh berkomunikasi langsung dengan database.

Seluruh operasi database harus melewati backend/API.

---

# 27. Rancangan Database SQL V2

Struktur database perlu dirancang ulang agar mendukung multi-toko, laporan, histori transaksi, dan role management.

## 27.1 Entitas utama

```text
users
roles
stores
products
categories
brands
stock_transactions
stock_transaction_items
stock_balances
```

Entitas pendukung yang dapat ditambahkan:

```text
suppliers
stock_adjustments
audit_logs
report_exports
```

## 27.2 Relasi konseptual

```text
ROLES
  │
  └──< USERS
          │
          └──< STORES

CATEGORIES ──< PRODUCTS >── BRANDS

STORES ──< STOCK_TRANSACTIONS
USERS  ──< STOCK_TRANSACTIONS

STOCK_TRANSACTIONS
          │
          └──< STOCK_TRANSACTION_ITEMS >── PRODUCTS
```

## 27.3 Prinsip Database

- Gunakan primary key pada seluruh tabel.
- Gunakan foreign key untuk relasi.
- Gunakan timestamp `created_at` dan `updated_at`.
- Jangan menyimpan nama barang berulang kali di transaksi jika dapat direlasikan menggunakan `product_id`.
- Transaksi stok tidak boleh bergantung pada data frontend.
- Penghapusan master barang sebaiknya menggunakan **soft delete** agar histori transaksi tetap dapat dibaca.
- Gunakan database transaction ketika menyimpan transaksi stok.
- Hindari menyimpan stok sebagai satu angka yang dapat diedit bebas.
- Saldo stok sebaiknya dihitung dari transaksi atau diperbarui secara aman melalui service/backend.

---

# 28. Contoh Struktur Tabel SQL

## `roles`

```text
id
name
created_at
updated_at
```

Contoh:

```text
1 | owner
2 | staff
```

## `users`

```text
id
role_id
store_id
name
username
password
is_active
created_at
updated_at
```

## `stores`

```text
id
code
name
address
is_active
created_at
updated_at
```

Contoh:

```text
BJ1 | Berkah Jaya 1
BJ2 | Berkah Jaya 2
BJ3 | Berkah Jaya 3
BJ4 | Berkah Jaya 4
```

## `categories`

```text
id
name
created_at
updated_at
```

## `brands`

```text
id
name
created_at
updated_at
```

## `products`

```text
id
category_id
brand_id
code
name
minimum_stock
is_active
created_at
updated_at
deleted_at
```

`minimum_stock` dibuat per produk agar batas stok tidak selalu hard-coded `5`.

## `stock_transactions`

```text
id
store_id
user_id
transaction_code
type
transaction_date
notes
created_at
updated_at
```

`type` minimal:

```text
IN
OUT
ADJUSTMENT
```

## `stock_transaction_items`

```text
id
stock_transaction_id
product_id
quantity
created_at
updated_at
```

Dengan struktur header-detail, satu transaksi dapat mencatat beberapa produk sekaligus.

---

# 29. Perubahan Konsep Stok

Versi lama menggunakan pola sederhana:

```text
Stok = Total Masuk - Total Keluar
```

Konsep ini tetap dipertahankan tetapi implementasinya diperkuat.

## V2

```text
Stok Akhir =
Stok Awal
+ Total Stok Masuk
- Total Stok Keluar
± Penyesuaian
```

Jika sistem nantinya memiliki transfer antar-toko:

```text
Stok Akhir =
Stok Awal
+ Masuk
- Keluar
+ Transfer Masuk
- Transfer Keluar
± Adjustment
```

Semua perubahan stok harus memiliki sumber transaksi yang jelas.

---

# 30. Revisi UI/UX — Untuk Orang Awam

## 30.1 Masalah UI/UX Versi Lama

Versi sebelumnya cukup teknis dan menggunakan istilah seperti:
- `Staff`
- `Owner`
- `Stok In`
- `Stok Out`
- `Buku Besar`
- `Device Code`
- `Store ID`

Istilah tersebut tidak ideal untuk pengguna toko yang tidak terbiasa dengan aplikasi inventory.

V2 harus menggunakan **bahasa operasional sehari-hari**.

---

# 31. Prinsip UI/UX V2

### 1. Sederhana

Pengguna tidak perlu memahami cara kerja database atau inventory system.

### 2. Satu layar = satu tujuan

Hindari terlalu banyak informasi dalam satu halaman.

### 3. Tombol besar

Tombol utama harus mudah disentuh menggunakan smartphone.

### 4. Bahasa manusia

Gunakan:

```text
Barang Masuk
Barang Keluar
Lihat Stok
Riwayat
Laporan
Kelola Barang
```

bukan:

```text
IN
OUT
Transaction Ledger
Inventory Management
```

### 5. Feedback jelas

Setiap tindakan harus memberikan feedback:

```text
✓ Barang berhasil dicatat
```

atau:

```text
⚠ Jumlah barang tidak boleh 0
```

### 6. Minimalkan input manual

Gunakan:
- dropdown;
- pencarian;
- tombol +/−;
- pilihan kategori;
- pilihan barang;
- default value;
- autocomplete.

---

# 32. Navigasi Staff V2

Navigasi staff dibuat sangat sederhana:

```text
Beranda
Barang Masuk
Barang Keluar
Riwayat
```

Jika menggunakan bottom navigation:

```text
┌─────────┬───────────┬─────────┬──────────┐
│ Beranda │   Masuk   │  Keluar │ Riwayat  │
└─────────┴───────────┴─────────┴──────────┘
```

## Beranda Staff

Menampilkan:

```text
Selamat datang, Andi

Berkah Jaya 1

[ + Barang Masuk ]

[ − Barang Keluar ]

Stok Menipis
3 barang

Transaksi Hari Ini
12 transaksi
```

Tujuan utama adalah membuat staff langsung tahu apa yang harus dilakukan.

---

# 33. Alur Barang Masuk

```text
Barang Masuk
      ↓
Cari / pilih barang
      ↓
Pilih jumlah
      ↓
Opsional: catatan
      ↓
Periksa
      ↓
[ Simpan Barang Masuk ]
      ↓
✓ Berhasil
```

Setelah disimpan:

```text
Barang berhasil masuk

Indomie Goreng
+ 20 pcs

Stok sekarang: 45 pcs
```

---

# 34. Alur Barang Keluar

```text
Barang Keluar
      ↓
Cari / pilih barang
      ↓
Pilih jumlah
      ↓
Periksa stok
      ↓
[ Simpan Barang Keluar ]
      ↓
✓ Berhasil
```

Jika jumlah melebihi stok:

```text
⚠ Stok tidak mencukupi

Stok tersedia: 5 pcs
Jumlah yang diminta: 10 pcs
```

Sistem sebaiknya mencegah transaksi keluar yang tidak valid kecuali role tertentu memang memiliki hak melakukan adjustment.

---

# 35. Pemilihan Barang

Daripada menampilkan daftar produk yang terlalu panjang, gunakan:

```text
🔍 Cari barang...

Kategori
[ Rokok ] [ Sembako ] [ Makanan ]

Hasil:
┌──────────────────────────┐
│ Sampoerna Mild           │
│ Stok: 24 pcs             │
│                    >     │
└──────────────────────────┘
```

Informasi stok ditampilkan sebelum pengguna memilih jumlah.

---

# 36. Dashboard Owner V2

Dashboard owner harus berorientasi pada pertanyaan bisnis.

Bukan hanya:

```text
Total Masuk
Total Keluar
```

tetapi:

```text
Bagaimana kondisi stok toko saya hari ini?

Berapa barang yang menipis?

Toko mana yang paling banyak melakukan transaksi?

Barang apa yang paling sering keluar?

Berapa transaksi hari ini?

Bagaimana kondisi stok dibanding periode sebelumnya?
```

---

# 37. Modul Laporan V2 — Redesain

Modul laporan akan menjadi salah satu fitur utama aplikasi.

## 37.1 Dashboard Laporan

Filter utama:

```text
Periode
[ Hari ini ▼ ]

Toko
[ Semua toko ▼ ]

Kategori
[ Semua kategori ▼ ]
```

Periode yang tersedia:

- Hari ini
- Kemarin
- 7 hari terakhir
- Bulan ini
- Bulan lalu
- Custom tanggal

---

# 38. Jenis Laporan

## Laporan 1 — Ringkasan Stok

Menampilkan:

```text
Total Produk
Total Stok
Produk Stok Menipis
Produk Stok Habis
```

Contoh:

| Informasi | Nilai |
|---|---:|
| Total Produk | 120 |
| Total Stok | 3.450 pcs |
| Stok Menipis | 12 |
| Stok Habis | 4 |

---

## Laporan 2 — Barang Masuk

Menampilkan:
- periode;
- toko;
- produk;
- jumlah;
- tanggal;
- petugas.

Contoh:

| Tanggal | Toko | Barang | Jumlah | Petugas |
|---|---|---|---:|---|
| 06/09/2026 | BJ1 | Sampoerna Mild | 20 | Andi |

---

## Laporan 3 — Barang Keluar

Menampilkan:
- periode;
- toko;
- produk;
- jumlah;
- tanggal;
- petugas.

---

## Laporan 4 — Stok Menipis

Menampilkan:

| Barang | Toko | Stok | Minimum | Status |
|---|---|---:|---:|---|
| Produk A | BJ1 | 3 | 5 | Menipis |
| Produk B | BJ2 | 1 | 5 | Menipis |

Status:

```text
AMAN
MENIPIS
HABIS
```

---

## Laporan 5 — Pergerakan Barang

Menunjukkan barang yang paling banyak bergerak.

Contoh:

```text
Barang paling banyak keluar

1. Produk A     240 pcs
2. Produk B     180 pcs
3. Produk C     150 pcs
```

Ini membantu owner menentukan barang yang perlu lebih sering disediakan.

---

## Laporan 6 — Performa Toko

Membandingkan aktivitas setiap toko:

| Toko | Masuk | Keluar | Transaksi |
|---|---:|---:|---:|
| BJ1 | 350 | 290 | 85 |
| BJ2 | 310 | 250 | 73 |
| BJ3 | 420 | 380 | 94 |
| BJ4 | 280 | 220 | 61 |

Laporan ini digunakan untuk melihat aktivitas operasional, **bukan otomatis dianggap sebagai laporan penjualan**, karena sistem stok belum tentu memiliki data harga/penjualan.

---

# 39. Grafik Laporan

Dashboard laporan dapat menggunakan:

### Grafik 1
**Barang Masuk vs Barang Keluar**

Line/bar chart berdasarkan hari.

### Grafik 2
**Top Barang Keluar**

Bar chart.

### Grafik 3
**Aktivitas per Toko**

Bar chart.

### Grafik 4
**Distribusi Stok per Kategori**

Pie/donut chart atau alternatif visual sederhana.

Grafik harus tetap memiliki tabel data sehingga pengguna tidak bergantung pada visual saja.

---

# 40. Export Laporan

Owner dapat melakukan:

```text
[ Export Excel ]

[ Export PDF ]

[ Cetak ]
```

Export harus mengikuti filter yang sedang aktif.

Contoh:

```text
Laporan Barang Keluar
Periode: 01–30 September 2026
Toko: Berkah Jaya 1
Kategori: Rokok
```

---

# 41. Laporan untuk Orang Awam

Laporan tidak boleh hanya berupa tabel besar.

Gunakan pola:

```text
┌─────────────────────────────┐
│ Laporan Stok                │
│ September 2026              │
├─────────────────────────────┤
│ Total stok       3.450 pcs  │
│ Stok menipis        12      │
│ Stok habis           4      │
├─────────────────────────────┤
│ Barang paling banyak keluar │
│                             │
│ Sampoerna Mild     240 pcs  │
│ Indomie             180 pcs │
│ Aqua                150 pcs │
└─────────────────────────────┘
```

Setelah ringkasan, baru tampilkan detail.

---

# 42. Modul Master Barang V2

Owner dapat:

- tambah barang;
- ubah barang;
- nonaktifkan barang;
- ubah kategori;
- ubah brand;
- menentukan stok minimum;
- mencari barang.

Alih-alih langsung menghapus barang, gunakan:

```text
Aktif
Tidak Aktif
```

Hal ini menjaga histori transaksi.

---

# 43. Modul Manajemen Toko

Owner dapat mengelola:

- nama toko;
- kode toko;
- alamat;
- status aktif.

Dengan demikian penambahan toko tidak perlu mengubah source code.

Versi lama:

```text
BJ1
BJ2
BJ3
BJ4
```

V2:

```text
stores table
```

sehingga jumlah toko dapat bertambah secara dinamis.

---

# 44. Modul Pengguna

Owner dapat mengelola akun:

```text
Nama
Username
Role
Toko
Status
```

Contoh:

```text
Andi
Staff
Berkah Jaya 1
Aktif
```

Staff hanya dapat melihat dan melakukan transaksi pada toko yang ditugaskan.

Owner dapat melihat seluruh toko.

---

# 45. Hak Akses V2

| Fitur | Owner | Staff |
|---|:---:|:---:|
| Dashboard | ✓ | ✓ |
| Lihat stok toko sendiri | ✓ | ✓ |
| Lihat semua toko | ✓ | - |
| Barang masuk | ✓ | ✓ |
| Barang keluar | ✓ | ✓ |
| Riwayat transaksi | ✓ | ✓ |
| Laporan | ✓ | Terbatas |
| Kelola barang | ✓ | - |
| Kelola toko | ✓ | - |
| Kelola pengguna | ✓ | - |
| Adjustment stok | ✓ | - |
| Export laporan | ✓ | - |

---

# 46. Keamanan V2

Karena Firebase tidak lagi menjadi database utama, autentikasi dan otorisasi dipindahkan ke backend.

Minimal:

- password disimpan menggunakan hashing;
- session/token aman;
- role-based access control;
- validasi server-side;
- validasi input;
- CSRF protection jika menggunakan session-based web;
- prepared statement/ORM;
- foreign key;
- database transaction;
- audit log untuk aktivitas penting.

Staff tidak boleh memanipulasi `store_id` melalui request untuk mengakses toko lain.

Backend harus mengambil toko berdasarkan user yang sedang login.

---

# 47. Stack Teknologi Rebuild yang Direkomendasikan

### Backend

**Laravel**

Alasan:
- cocok dengan PostgreSQL;
- ORM Eloquent;
- migration;
- authentication;
- authorization;
- validation;
- API;
- reporting/query SQL;
- mudah dikembangkan.

### Database

**PostgreSQL**

### Frontend

Pilihan utama:

**Laravel Blade + Tailwind CSS + Alpine.js**

untuk MVP yang sederhana dan mudah dipelihara.

Jika kebutuhan aplikasi nantinya menjadi sangat interaktif:

**Laravel API + React**

dapat digunakan sebagai tahap berikutnya.

### Mobile

Untuk tahap awal tidak perlu membuat native Android.

Gunakan:

**Responsive Web + PWA**

sehingga staff dapat menggunakan aplikasi melalui smartphone.

---

# 48. Struktur Rebuild

Struktur konseptual:

```text
toko-madura-v2/
├── app/
│   ├── Models/
│   ├── Services/
│   ├── Http/
│   └── Policies/
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── views/
│   ├── css/
│   └── js/
├── routes/
│   ├── web.php
│   └── api.php
├── public/
├── tests/
└── README.md
```

---

# 49. Tahapan Rebuild

## Phase 1 — Analisis

- Finalisasi kebutuhan bisnis.
- Finalisasi role.
- Finalisasi toko.
- Finalisasi kategori dan produk.
- Finalisasi alur stok.

## Phase 2 — Database

- Membuat ERD.
- Membuat migration.
- Membuat foreign key.
- Membuat seeder.
- Membuat database PostgreSQL.
- Menguji transaksi stok.

## Phase 3 — Backend

- Authentication.
- Role & permission.
- CRUD toko.
- CRUD kategori.
- CRUD brand.
- CRUD produk.
- Transaksi stok masuk.
- Transaksi stok keluar.
- Stock calculation.
- Reporting API/service.

## Phase 4 — UI/UX

- Design system.
- Mobile-first layout.
- Dashboard staff.
- Input barang masuk.
- Input barang keluar.
- Riwayat.
- Dashboard owner.
- Laporan.
- Master barang.
- Master toko.
- User management.

## Phase 5 — Testing

- Unit test.
- Feature test.
- Validation test.
- Role authorization test.
- Stock calculation test.
- Report accuracy test.
- Responsive testing.

## Phase 6 — Deployment

- Production database.
- Environment configuration.
- HTTPS.
- Backup database.
- Monitoring.
- Error logging.

---

# 50. Acceptance Criteria Rebuild

### Database
- [ ] Tidak lagi menggunakan Firestore sebagai database utama.
- [ ] Data utama tersimpan pada PostgreSQL.
- [ ] Seluruh relasi menggunakan foreign key.
- [ ] Transaksi stok menggunakan database transaction.
- [ ] Produk yang dinonaktifkan tetap dapat muncul pada histori lama.

### UI/UX
- [ ] Staff awam dapat mencatat transaksi tanpa membaca dokumentasi teknis.
- [ ] Tombol utama mudah ditemukan.
- [ ] UI nyaman digunakan di smartphone.
- [ ] Istilah teknis diminimalkan.
- [ ] Setiap transaksi memberikan feedback berhasil/gagal.
- [ ] Form memvalidasi input dengan jelas.

### Laporan
- [ ] Laporan dapat difilter berdasarkan periode.
- [ ] Laporan dapat difilter berdasarkan toko.
- [ ] Laporan dapat difilter berdasarkan kategori.
- [ ] Laporan stok menampilkan stok menipis.
- [ ] Laporan barang masuk tersedia.
- [ ] Laporan barang keluar tersedia.
- [ ] Laporan pergerakan barang tersedia.
- [ ] Performa aktivitas toko tersedia.
- [ ] Data laporan dapat diekspor ke Excel/PDF.
- [ ] Angka laporan harus konsisten dengan transaksi database.

### Security
- [ ] Password tidak disimpan plaintext.
- [ ] Staff tidak dapat mengakses toko lain.
- [ ] Staff tidak dapat mengelola master barang.
- [ ] Endpoint/API tervalidasi.
- [ ] Owner memiliki akses administratif.
- [ ] Aktivitas penting dapat dicatat melalui audit log.

---

# 51. Definition of Done — Rebuild V2

Rebuild dianggap selesai untuk MVP apabila:

1. User dapat login.
2. User memiliki role.
3. Staff terikat dengan toko.
4. Owner dapat melihat seluruh toko.
5. Owner dapat mengelola master barang.
6. Staff dapat mencatat barang masuk.
7. Staff dapat mencatat barang keluar.
8. Sistem menghitung stok dengan benar.
9. Sistem memberikan peringatan stok minimum.
10. Owner dapat melihat laporan berdasarkan periode dan toko.
11. Laporan barang masuk dan keluar tersedia.
12. Laporan dapat diekspor.
13. Database menggunakan PostgreSQL.
14. UI dapat digunakan dengan nyaman oleh orang awam melalui smartphone.
15. Hak akses telah divalidasi di backend.
16. Tidak ada ketergantungan pada kode toko yang di-hard-code di frontend.

---

# 52. Prioritas Fitur Rebuild

## P0 — Wajib

- SQL database.
- Authentication.
- Role & permission.
- Multi-toko.
- Master produk.
- Barang masuk.
- Barang keluar.
- Perhitungan stok.
- Riwayat.
- Dashboard sederhana.
- Laporan dasar.
- UI/UX mobile-first.

## P1 — Sangat penting

- Filter laporan.
- Export Excel.
- Export PDF.
- Stok minimum per produk.
- Dashboard per toko.
- User management.
- Store management.
- Audit log.

## P2 — Pengembangan

- Transfer stok antar toko.
- Supplier.
- Purchase order.
- Barcode.
- Notifikasi stok.
- Laporan tren.
- Perbandingan periode.

## P3 — Advanced

- Forecast kebutuhan stok.
- Analitik inventory.
- Integrasi penjualan.
- Integrasi kasir/POS.
- Dashboard bisnis lanjutan.

---

# 53. Catatan Penting untuk Rebuild

Rebuild **tidak sebaiknya dilakukan dengan cara memindahkan kode Firebase menjadi SQL secara langsung**.

Yang lebih tepat adalah:

```text
Aplikasi Lama
     ↓
Analisis fitur & alur bisnis
     ↓
Evaluasi masalah
     ↓
Redesign database
     ↓
Redesign UI/UX
     ↓
Redesign business logic
     ↓
Implementasi Backend
     ↓
Implementasi Frontend
     ↓
Testing
     ↓
Toko Madura V2
```

Dengan pendekatan ini, aplikasi baru tidak membawa keterbatasan arsitektur lama ke versi baru.

**Target akhir V2:** aplikasi stok yang sederhana untuk staff, informatif untuk owner, aman secara backend, menggunakan SQL sebagai database utama, dan memiliki laporan yang dapat digunakan untuk mengambil keputusan operasional.


---

# 54. Revisi Sistem Login & Kepemilikan Toko V2

## 54.1 Konsep Akun

Sistem login V2 tidak lagi menggunakan kode perangkat seperti `BJ1`, `BJ2`, `BJ3`, `BJ4`, atau `OWNER`.

Aplikasi menggunakan konsep:

```text
1 akun = 1 pemilik usaha
        ↓
   Owner Account
        ↓
   ┌────┼────┐
   ↓    ↓    ↓
 Toko 1 Toko 2 Toko 3
   ↓    ↓    ↓
Staff Staff Staff
```

Satu owner dapat memiliki **maksimal 3 toko**.

Owner dapat membuat akun penjaga toko/staff dan menghubungkan setiap staff ke toko tertentu.

---

# 55. Registrasi Owner

## 55.1 Alur Registrasi

Pengguna baru memilih:

**Daftar sebagai Pemilik Toko**

Form minimal:

```text
Nama Pemilik
Nama Usaha
Email / Username
Password
Konfirmasi Password
```

Setelah berhasil:

```text
Register
   ↓
Buat User
   ↓
Role = OWNER
   ↓
Buat Owner Profile
   ↓
Data toko masih kosong
   ↓
Masuk ke Setup Toko
```

## 55.2 Kondisi Awal

Setelah registrasi, owner **belum memiliki toko**.

Data awal:

```text
Owner
✓ Akun dibuat
✓ Role OWNER
✓ Profil dibuat
✗ Toko belum dibuat
✗ Staff belum dibuat
✗ Produk belum dibuat
✗ Transaksi belum ada
```

Dengan demikian setiap akun baru benar-benar dimulai dari kondisi kosong.

---

# 56. Onboarding Owner

Setelah login pertama kali, owner diarahkan ke proses setup.

### Step 1 — Profil Usaha

```text
Nama Usaha
Deskripsi (opsional)
```

### Step 2 — Tambah Toko

Owner dapat membuat toko pertama:

```text
Nama Toko
Alamat
```

Owner dapat menambahkan maksimal **3 toko**.

Contoh:

```text
Toko 1
Berkah Jaya 1

Toko 2
Berkah Jaya 2

Toko 3
Berkah Jaya 3
```

### Step 3 — Tambah Penjaga Toko

Setelah toko dibuat, owner dapat membuat akun penjaga.

```text
Nama Penjaga
Username
Password awal
Toko
Status
```

Contoh:

```text
Andi
andi.bj1
********
Berkah Jaya 1
Aktif
```

---

# 57. Batasan Jumlah Toko

Setiap owner maksimal memiliki **3 toko aktif**.

Aturan:

```text
0 toko → boleh tambah
1 toko → boleh tambah
2 toko → boleh tambah
3 toko → tidak boleh tambah toko baru
```

Jika owner sudah memiliki 3 toko:

```text
Batas toko tercapai.

Akun Anda sudah memiliki 3 toko.
```

### Catatan

Batas 3 toko berlaku untuk **toko aktif**.

Jika sistem nantinya menggunakan soft delete/nonaktifkan toko, aturan jumlah toko aktif perlu diterapkan pada backend.

---

# 58. Manajemen Penjaga Toko

Owner dapat membuat dan mengelola akun staff.

## Fitur Owner

Owner dapat:

- tambah staff;
- ubah data staff;
- reset password;
- aktif/nonaktifkan akun;
- menghubungkan staff ke toko;
- memindahkan staff ke toko lain;
- melihat aktivitas staff.

### Contoh

```text
Penjaga Toko

┌──────────────────────────────┐
│ Andi                         │
│ Berkah Jaya 1                │
│ Aktif                        │
│                              │
│ [ Edit ] [ Nonaktifkan ]     │
└──────────────────────────────┘
```

---

# 59. Konsep Role V2

Role utama:

```text
OWNER
STAFF
```

## OWNER

Owner adalah pemilik akun/usaha.

Owner memiliki akses ke seluruh data yang berada di bawah akun tersebut.

Owner dapat:

- melihat seluruh toko;
- melihat seluruh stok;
- melihat seluruh transaksi;
- melihat seluruh laporan;
- mengelola toko;
- mengelola staff;
- mengelola produk;
- mengelola kategori;
- mengelola brand;
- melakukan adjustment stok;
- melakukan export;
- melihat aktivitas pengguna;
- mengatur profil usaha.

## STAFF

Staff adalah penjaga toko.

Staff hanya dapat bekerja pada toko yang ditugaskan kepadanya.

---

# 60. Fitur yang Disarankan untuk Penjaga Toko

Menurut kebutuhan aplikasi stok, staff **tidak perlu diberi akses ke seluruh sistem**.

Prinsipnya:

> Staff fokus menjalankan operasional toko. Owner fokus mengelola bisnis.

## Fitur Staff yang DIIZINKAN

### 60.1 Dashboard

Staff dapat melihat:

```text
Toko saya
Berkah Jaya 1

Total jenis barang
Stok menipis
Transaksi hari ini
```

### 60.2 Lihat Stok

Staff dapat melihat stok toko sendiri.

Dapat:
- mencari barang;
- memilih kategori;
- melihat jumlah stok;
- melihat status stok.

Contoh:

```text
Sampoerna Mild
Stok: 24 pcs
Status: Aman
```

### 60.3 Barang Masuk

Staff dapat mencatat barang masuk.

```text
Pilih barang
↓
Jumlah
↓
Catatan (opsional)
↓
Simpan
```

### 60.4 Barang Keluar

Staff dapat mencatat barang keluar.

```text
Pilih barang
↓
Jumlah
↓
Catatan (opsional)
↓
Simpan
```

Sistem harus mengecek ketersediaan stok sebelum transaksi keluar.

### 60.5 Riwayat Transaksi

Staff dapat melihat transaksi **tokonya sendiri**.

Filter minimal:

- hari ini;
- kemarin;
- 7 hari terakhir.

Staff tidak dapat melihat transaksi toko lain.

### 60.6 Detail Transaksi

Staff dapat membuka detail transaksi untuk memastikan:

```text
Jenis transaksi
Barang
Jumlah
Tanggal
Jam
Petugas
Catatan
```

### 60.7 Stok Menipis

Staff perlu mengetahui barang yang harus diperhatikan.

Contoh:

```text
⚠ Stok Menipis

Indomie Goreng
3 pcs

Sampoerna Mild
4 pcs
```

Fitur ini membantu staff mengetahui barang yang perlu dilaporkan kepada owner.

### 60.8 Profil

Staff dapat melihat profilnya sendiri:

```text
Nama
Username
Toko
Role
```

Staff dapat mengubah data profil yang diperbolehkan sistem.

---

# 61. Fitur Staff yang TIDAK DIIZINKAN

Staff tidak boleh:

- membuat toko;
- menghapus toko;
- melihat toko lain;
- membuat akun staff;
- menghapus akun staff;
- mengubah role;
- mengubah owner;
- menambah/menghapus kategori;
- menambah/menghapus brand;
- menghapus produk;
- mengubah stok secara manual;
- melakukan adjustment stok;
- melihat laporan seluruh toko;
- export laporan bisnis;
- mengubah konfigurasi usaha.

### Alasan

Jika staff memiliki akses tersebut, kontrol owner terhadap data inventory menjadi lemah.

---

# 62. Apakah Staff Perlu Fitur Laporan?

Untuk V2, **staff tidak perlu mendapatkan modul laporan penuh**.

Sebagai gantinya staff mendapatkan:

```text
Dashboard
+
Stok
+
Stok Menipis
+
Riwayat Transaksi
```

Owner mendapatkan laporan lengkap.

### Alasan

Staff membutuhkan informasi untuk melakukan pekerjaan harian, sedangkan laporan analitik digunakan owner untuk mengambil keputusan bisnis.

Namun staff tetap dapat melihat **ringkasan operasional tokonya sendiri**, misalnya:

```text
Transaksi hari ini
Barang masuk hari ini
Barang keluar hari ini
```

Ini bukan laporan bisnis penuh.

---

# 63. Matriks Hak Akses V2

| Fitur | Owner | Staff |
|---|:---:|:---:|
| Dashboard | ✓ Semua toko | ✓ Toko sendiri |
| Lihat stok | ✓ Semua toko | ✓ Toko sendiri |
| Barang masuk | ✓ | ✓ |
| Barang keluar | ✓ | ✓ |
| Riwayat transaksi | ✓ Semua toko | ✓ Toko sendiri |
| Detail transaksi | ✓ | ✓ Toko sendiri |
| Stok menipis | ✓ Semua toko | ✓ Toko sendiri |
| Laporan lengkap | ✓ | - |
| Ringkasan operasional | ✓ | ✓ |
| Export Excel | ✓ | - |
| Export PDF | ✓ | - |
| Kelola produk | ✓ | - |
| Kelola kategori | ✓ | - |
| Kelola brand | ✓ | - |
| Adjustment stok | ✓ | - |
| Kelola toko | ✓ | - |
| Tambah toko | ✓ Maks. 3 | - |
| Kelola staff | ✓ | - |
| Kelola role | ✓ | - |
| Profil usaha | ✓ | - |
| Audit log | ✓ | - |
| Pengaturan sistem | ✓ | - |

---

# 64. Revisi Database SQL untuk Multi-Owner

Karena satu aplikasi dapat memiliki banyak owner, struktur database perlu menggunakan konsep **tenant/ownership**.

Relasi utama:

```text
OWNER
  │
  ├──< STORES
  │      │
  │      └──< USERS/STAFF
  │
  └──< PRODUCTS
         │
         └──< STOCK TRANSACTIONS
```

Namun produk sebaiknya juga memiliki `owner_id` agar produk satu owner tidak bercampur dengan owner lain.

## `users`

```text
id
owner_id
store_id
name
username
password
role
is_active
created_at
updated_at
```

### Interpretasi

Owner:

```text
owner_id = NULL
store_id = NULL
role = OWNER
```

Staff:

```text
owner_id = ID owner
store_id = ID toko
role = STAFF
```

## `stores`

```text
id
owner_id
code
name
address
is_active
created_at
updated_at
```

Setiap toko wajib memiliki `owner_id`.

## `products`

```text
id
owner_id
category_id
brand_id
code
name
minimum_stock
is_active
created_at
updated_at
deleted_at
```

Dengan demikian produk antar-owner benar-benar terisolasi.

## `stock_transactions`

```text
id
owner_id
store_id
user_id
transaction_code
type
transaction_date
notes
created_at
updated_at
```

## `stock_transaction_items`

```text
id
stock_transaction_id
product_id
quantity
created_at
updated_at
```

---

# 65. Aturan Isolasi Data Owner

Ini merupakan aturan keamanan yang sangat penting.

Owner A:

```text
Owner A
├── Toko A1
├── Toko A2
└── Toko A3
```

Owner B:

```text
Owner B
├── Toko B1
└── Toko B2
```

Owner A **tidak boleh melihat atau mengubah data Owner B**.

Bahkan jika seseorang mencoba mengubah:

```text
store_id
owner_id
product_id
```

melalui request HTTP, backend harus tetap memvalidasi kepemilikan data.

---

# 66. Aturan Akses Staff

Staff harus dibatasi pada:

```text
user.owner_id
AND
user.store_id
```

Contoh:

```text
Staff Andi
owner_id = 10
store_id = 2
```

Maka Andi hanya dapat membaca/mengubah data:

```text
owner_id = 10
store_id = 2
```

Andi tidak boleh mengakses:

```text
owner_id = 10, store_id = 1
owner_id = 10, store_id = 3
owner_id = 11, store_id = 1
```

Validasi ini harus dilakukan di **backend**, bukan hanya disembunyikan dari UI.

---

# 67. Dashboard Owner V2

Karena owner dapat memiliki maksimal 3 toko, dashboard owner menggunakan pilihan:

```text
Semua Toko
Berkah Jaya 1
Berkah Jaya 2
Berkah Jaya 3
```

Jika owner baru memiliki satu toko:

```text
Berkah Jaya 1
```

Jika belum memiliki toko:

```text
Anda belum memiliki toko.

[ + Tambah Toko ]
```

---

# 68. Dashboard Owner — Informasi Utama

Owner melihat:

```text
Selamat datang, Bapak Adam

3 Toko
────────────────────

Total Stok
3.450 pcs

Stok Menipis
12 barang

Stok Habis
4 barang

Barang Masuk
580 pcs

Barang Keluar
430 pcs
```

Kemudian:

```text
Aktivitas Toko

Berkah Jaya 1
85 transaksi

Berkah Jaya 2
73 transaksi

Berkah Jaya 3
94 transaksi
```

---

# 69. Owner sebagai Pusat Kontrol

Prinsip V2:

```text
                    OWNER
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     TOKO 1         TOKO 2        TOKO 3
        │             │             │
      STAFF         STAFF         STAFF
        │             │             │
      STOK          STOK          STOK
        │             │             │
   TRANSAKSI      TRANSAKSI     TRANSAKSI
        └─────────────┼─────────────┘
                      ↓
                   LAPORAN
```

Owner memiliki visibilitas penuh.

Staff hanya melihat cabang yang menjadi tanggung jawabnya.

---

# 70. Revisi Alur Login V2

## Pengguna Baru

```text
Landing Page
     ↓
Daftar
     ↓
Isi data owner
     ↓
Validasi
     ↓
Buat akun OWNER
     ↓
Login otomatis
     ↓
Onboarding
     ↓
Tambah toko
     ↓
Dashboard Owner
```

## Owner Lama

```text
Login
 ↓
Dashboard Owner
```

## Staff

```text
Login
 ↓
Validasi akun
 ↓
Cek role
 ↓
STAFF?
 ↓
Ambil store_id dari akun
 ↓
Dashboard toko
```

Staff **tidak memilih toko saat login**.

Toko sudah ditentukan oleh akun staff yang dibuat owner.

---

# 71. Revisi Struktur Navigasi

## Staff

```text
Beranda
Stok
Barang Masuk
Barang Keluar
Riwayat
Profil
```

Navigasi mobile:

```text
┌────────┬────────┬────────┬────────┬────────┐
│Beranda │  Stok  │  Masuk │ Riwayat│ Profil │
└────────┴────────┴────────┴────────┴────────┘
```

Aksi utama dapat dibuat sebagai tombol besar:

```text
[ + Barang Masuk ]

[ − Barang Keluar ]
```

## Owner

```text
Dashboard
Stok
Transaksi
Laporan
Barang
Toko
Pengguna
Pengaturan
```

---

# 72. Revisi Onboarding Owner yang Direkomendasikan

Untuk membuat pengalaman pengguna lebih ramah, owner baru tidak langsung dilempar ke dashboard kosong.

Gunakan wizard:

```text
Selamat datang!

Mari kita siapkan toko Anda.
Ini hanya membutuhkan beberapa langkah.

[ Mulai ]
```

### Step 1

```text
Nama Usaha
[________________]
```

### Step 2

```text
Buat toko pertama

Nama toko
[________________]

Alamat
[________________]

[ Simpan & Lanjutkan ]
```

### Step 3

```text
Tambahkan penjaga toko

Belum sekarang
atau

[ + Tambah Penjaga ]
```

### Step 4

```text
Toko Anda sudah siap!

Berkah Jaya 1
1 penjaga

[ Masuk ke Dashboard ]
```

---

# 73. Aturan Bisnis Login & Ownership

### RB-AUTH-01
Registrasi publik selalu membuat role `OWNER`.

### RB-AUTH-02
Owner baru tidak otomatis memiliki toko.

### RB-AUTH-03
Owner dapat membuat maksimal 3 toko aktif.

### RB-AUTH-04
Owner dapat membuat staff tanpa membuat owner baru.

### RB-AUTH-05
Setiap staff harus memiliki satu owner.

### RB-AUTH-06
Setiap staff aktif harus ditugaskan ke satu toko.

### RB-AUTH-07
Staff tidak dapat memilih atau mengganti toko sendiri.

### RB-AUTH-08
Hanya owner yang dapat membuat akun staff.

### RB-AUTH-09
Hanya owner yang dapat mengubah penugasan staff ke toko.

### RB-AUTH-10
Owner dapat melihat seluruh data toko miliknya.

### RB-AUTH-11
Owner tidak dapat melihat data owner lain.

### RB-AUTH-12
Staff hanya dapat melihat data toko yang ditugaskan.

### RB-AUTH-13
Semua aturan ownership harus divalidasi backend.

### RB-AUTH-14
Menonaktifkan staff tidak menghapus histori transaksi staff tersebut.

### RB-AUTH-15
Menonaktifkan toko tidak menghapus histori transaksi toko.

---

# 74. Revisi Acceptance Criteria Login

### Registrasi
- [ ] Pengguna dapat membuat akun baru.
- [ ] Akun baru otomatis memiliki role OWNER.
- [ ] Setelah registrasi, owner belum memiliki toko.
- [ ] Owner diarahkan ke onboarding jika belum memiliki toko.
- [ ] Data owner lain tidak dapat terlihat.

### Toko
- [ ] Owner dapat membuat toko.
- [ ] Owner dapat memiliki maksimal 3 toko aktif.
- [ ] Owner dapat mengubah data toko.
- [ ] Owner dapat menonaktifkan toko.
- [ ] Toko yang dinonaktifkan tetap memiliki histori.

### Staff
- [ ] Owner dapat membuat akun staff.
- [ ] Owner dapat menentukan toko staff.
- [ ] Staff tidak dapat memilih toko sendiri.
- [ ] Staff hanya dapat mengakses toko yang ditugaskan.
- [ ] Owner dapat menonaktifkan staff.
- [ ] Staff yang dinonaktifkan tidak dapat login.
- [ ] Histori transaksi staff tetap tersimpan.

### Authorization
- [ ] Staff tidak dapat mengakses dashboard owner.
- [ ] Staff tidak dapat mengakses laporan seluruh toko.
- [ ] Staff tidak dapat mengelola produk.
- [ ] Staff tidak dapat mengelola toko.
- [ ] Staff tidak dapat mengelola user.
- [ ] Backend memvalidasi `owner_id` dan `store_id` pada setiap operasi sensitif.

---

# 75. Kesimpulan Revisi Role

Model yang digunakan pada V2 adalah:

```text
REGISTRASI
    ↓
  OWNER
    ↓
0–3 TOKO
    ↓
STAFF
    ↓
OPERASIONAL TOKO
```

**Owner = pengelola bisnis dan pusat kontrol.**

**Staff = pelaksana operasional toko.**

Staff mendapatkan fitur yang cukup untuk pekerjaan sehari-hari tanpa memberikan akses yang dapat mengubah struktur bisnis.

Dengan model ini, aplikasi dapat berkembang dari:

```text
1 Owner
1 Toko
1 Staff
```

menjadi:

```text
1 Owner
3 Toko
Banyak Staff
```

tanpa perlu mengubah konsep login atau melakukan hard-code toko di frontend.

---

# #memory — Catatan Progres Pengerjaan

> Ditulis otomatis oleh asisten. Riwayat build: (1) build awal backend+frontend,
> (2) perbaikan bug kode transaksi + panduan instalasi lokal, (3) penambahan
> fitur dari daftar "belum dikerjakan". Gunakan bagian ini sebagai starting
> point jika melanjutkan di sesi berikutnya — jangan bangun ulang dari nol,
> cek dulu apa yang sudah ada di `backend/` dan `frontend/`.

## ✅ Sudah Selesai & Teruji

### Backend (Node.js + Express + PostgreSQL via Knex) — `backend/`
- **Skema database** (10 migrasi, dijalankan melalui PostgreSQL
  asli): `users` (owner & staff satu tabel, `owner_id` self-reference, +
  `recovery_question`/`recovery_answer_hash` untuk lupa password), `stores`
  (maks. 3 toko aktif per owner ditegakkan di kode), `categories` & `brands`
  (default global `owner_id IS NULL` + custom per-owner), `products` (soft
  delete via `deleted_at`), `stock_transactions` + `stock_transaction_items`
  (pola header/detail, `transaction_code` UNIQUE per `(owner_id, kode)` —
  bukan unik global, ini bug yang sempat ditemukan & diperbaiki di sesi
  sebelumnya), `audit_logs`.
- **Autentikasi**: register owner (kini wajib isi pertanyaan+jawaban
  keamanan), login (owner & staff endpoint sama), JWT (7 hari), bcrypt,
  `requireAuth` selalu re-check status aktif ke DB. **Rate limiting** pada
  `/auth/login`, `/auth/register`, `/auth/forgot-password` (10-20
  percobaan per window, dikunci per kombinasi IP+username) via
  `express-rate-limit`.
- **Lupa Password (owner only)**: `GET /auth/recovery-question?username=`
  mengembalikan pertanyaan (bukan jawaban), `POST /auth/forgot-password`
  memverifikasi jawaban (hash bcrypt, case-insensitive) lalu reset
  password. Staf tetap direset lewat owner (menu Kelola Staf), bukan
  self-service, karena tidak ada infrastruktur email/SMS.
- **Isolasi multi-tenant** tetap konsisten: staf selalu dipaksa pakai
  `store_id` miliknya sendiri di backend (`src/utils/storeScope.js`),
  parameter `storeId` dari klien untuk staf diabaikan.
- **Modul lengkap**: Auth, Stores, Staff, Categories, Brands, **Products
  (kini dengan paginasi `page`/`limit`, default 20/hal, maks 200)**, Stock
  (pilih barang + stok real-time, catat transaksi IN/OUT, riwayat
  berpaginasi), Dashboard, Reports (Ringkasan Stok, Barang Masuk/Keluar,
  Stok Menipis, Pergerakan Barang, Performa Toko, **+ Log Aktivitas/audit
  log baru** `GET /reports/audit-log`, owner-only, berpaginasi).
- **Export laporan**: Excel (`.xlsx` via SheetJS, sudah ada sebelumnya) DAN
  **PDF baru** (via `pdfkit`) untuk laporan Barang Masuk/Keluar
  (`/reports/export/movements-pdf`) dan Stok Menipis
  (`/reports/export/low-stock-pdf`) — tabel sederhana dengan header
  berwarna, auto page-break, styling konsisten dengan tema aplikasi.
- **Aturan bisnis yang ditegakkan & diuji otomatis** (semua tetap lulus
  setelah penambahan fitur baru): batas 3 toko aktif, barang keluar
  ditolak jika stok kurang (kecuali `isAdjustment` oleh owner), staf tidak
  bisa akses endpoint owner (Reports, Staff mgmt, **Audit Log**) — 403,
  hapus kategori/brand yang masih dipakai gagal, **lupa password menolak
  jawaban salah (401) dan menerima jawaban benar (case-insensitive)**,
  **paginasi produk menghormati parameter `limit`**.
- Skrip uji end-to-end `backend/scripts/test-e2e.js` (`npm test` dari
  folder `backend`) sudah diperluas mencakup semua fitur baru di atas.
  **Status: lulus semua (16 tahap skenario).**

### Frontend (React + Vite) — `frontend/`
- Semua yang sudah ada sebelumnya (desain sistem "buku stok digital", logo
  pengguna sebagai brand mark, layout responsif sidebar/bottom-nav, seluruh
  halaman owner & staff) — lihat riwayat commit sebelumnya untuk detail.
- **Baru ditambahkan**:
  - Field "Pertanyaan keamanan" + "Jawaban rahasia" di halaman Daftar.
  - Halaman baru **Lupa Password** (`/lupa-password`, alur 2 langkah: cari
    akun → jawab pertanyaan + set password baru) + link "Lupa password?"
    di halaman Login.
  - Tab **"Log Aktivitas"** di halaman Laporan (daftar aksi stok masuk/
    keluar per pengguna, dengan penanda "Penyesuaian" bila relevan).
  - Tombol **unduh PDF** (selain Excel yang sudah ada) di tab Barang
    Masuk/Keluar, dan tombol unduh PDF baru di tab Stok Menipis.
  - **Kontrol paginasi** (Sebelumnya/Berikutnya + info halaman) di Kelola
    Barang, mengikuti response `total`/`page`/`limit` dari backend.
  - **Perbaikan aksesibilitas**: semua `<label>` yang sebelumnya tidak
    terhubung ke input (memakai `htmlFor`/`id` yang hilang) di
    Profile, RecordForm, dan seluruh sheet modal (Products/Stores/Staff)
    sudah diperbaiki — ditemukan lewat pengujian otomatis, bukan cuma demi
    lulus tes, ini juga perbaikan aksesibilitas nyata untuk pembaca layar.
- **Pengujian otomatis frontend (BARU, dan ini yang paling signifikan)**:
  dipasang Vitest + React Testing Library + jsdom + user-event.
  - `frontend/src/test/mockApi.js` — mock `fetch` global dengan fixture
    realistis untuk SEMUA endpoint yang dipakai frontend.
  - `frontend/src/test/renderWithProviders.jsx` — helper render yang
    meniru `<RequireAuth>` asli (menahan render sampai `/auth/me` selesai)
    supaya halaman yang langsung baca `user.role` tidak crash palsu.
  - **22 test, semua lulus**, mencakup: halaman Login/Register/Lupa
    Password (termasuk validasi konfirmasi password & alur pertanyaan
    keamanan), dan render nyata (bukan cuma "tidak error") untuk SETIAP
    halaman owner (Dashboard, Kelola Barang, Kelola Toko, Kelola Staf,
    Laporan, Stok, Riwayat, Catat Masuk/Keluar) dan staff (Dashboard,
    Profil, Stok, Riwayat, Catat Masuk/Keluar) — termasuk aturan bisnis
    seperti "staf tidak melihat pemilih toko" dan "staf tidak melihat opsi
    penyesuaian stok".
  - Jalankan dengan `cd frontend && npm test`.
  - **Catatan jujur soal batasan**: ini tetap BUKAN pengujian visual di
    browser sungguhan — tidak ada screenshot, tidak ada klik pointer
    device asli, tidak ada uji CSS/responsif. Yang divalidasi adalah
    "apakah komponen React ini render tanpa error dan menampilkan data
    yang benar dari API", yang sudah jauh lebih kuat daripada sebelumnya
    (yang cuma modal `npm run build` sukses), tapi belum menggantikan
    kebutuhan klik-klik manual di browser asli terutama untuk soal
    tampilan/UX/responsif di HP.

## 🟡 Sedang Dikerjakan / Perlu Perhatian Saat Melanjutkan
- Proteksi konkurensi saat mencatat stok masih sederhana (lihat catatan di
  build sebelumnya) — solusi jangka panjang: tabel `stock_balances`
  ternormalisasi dengan row-level lock.
- Pengujian frontend baru mencakup smoke-level rendering, belum menguji
  alur submit form end-to-end (mis. isi form Tambah Barang → submit →
  cek API dipanggil dengan payload benar). Bisa diperluas kalau perlu
  keyakinan lebih tinggi sebelum deploy produksi.

## ❌ Belum Dikerjakan (di luar cakupan sesi ini)
- **Pengujian visual/interaktif di browser sungguhan** — masih prioritas
  tertinggi kalau mau yakin 100% sebelum dipakai produksi nyata.
- **Notifikasi aktif** (push/WhatsApp/email) untuk stok menipis — perlu
  kredensial layanan pihak ketiga (mis. Twilio/WA Business API/SMTP) yang
  belum tersedia di sesi ini.
- **Docker/CI/CD** — belum ada `Dockerfile`, `docker-compose.yml`, atau
  pipeline CI/CD otomatis.
- **Paginasi** di Kelola Toko dan Kelola Staf (belum krusial, datanya
  dibatasi kecil — maks. 3 toko, staf biasanya puluhan).
- Dependency `xlsx` (SheetJS 0.18.5) masih punya advisory keamanan untuk
  *parsing* file tak tepercaya; risiko rendah di sini (hanya dipakai untuk
  menulis), tapi perlu di-upgrade kalau nanti ada fitur impor Excel.
- Export PDF/Excel untuk laporan **Ringkasan Stok**, **Pergerakan
  Barang**, dan **Performa Toko** belum ada tombol unduh (baru Barang
  Masuk/Keluar dan Stok Menipis).

## Cara melanjutkan
1. `cd backend && npm install && npx knex migrate:latest && npx knex seed:run`
   lalu `npm run dev`. Jalankan `npm test` untuk memastikan 16 skenario
   inti masih lulus sebelum menambah fitur baru.
2. `cd frontend && npm install && npm run dev` untuk pakai aplikasinya, atau
   `npm test` untuk menjalankan 22 test otomatis yang sudah ada.
3. Prioritas berikutnya yang disarankan: uji visual manual di browser
   (klik-klik alur nyata di desktop & HP), baru lanjut ke item-item di
   bagian "Belum Dikerjakan" di atas sesuai kebutuhan.
