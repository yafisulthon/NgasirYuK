# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Sistem Informasi Kasir dan Manajemen Persediaan Toko Material Bangunan Berbasis Web

---

# 1. Informasi Umum

## Nama Produk

Sistem Informasi Kasir dan Manajemen Persediaan Toko Material Bangunan

## Jenis Aplikasi

Web-Based Application

## Target Pengguna

* Pemilik toko material
* Admin toko
* Kasir

## Tujuan Produk

Membangun sistem yang mampu membantu operasional toko material dalam mengelola:

* Data barang
* Persediaan stok
* Supplier
* Pembelian barang
* Penjualan barang
* Pelaporan
* Monitoring aktivitas pengguna

Sistem dirancang untuk menggantikan pencatatan manual dan meningkatkan akurasi data operasional toko.

---

# 2. Tujuan Bisnis

### Permasalahan Saat Ini

* Pencatatan stok masih manual
* Kesalahan perhitungan transaksi
* Sulit mengetahui stok tersedia
* Sulit mengetahui produk terlaris
* Laporan dibuat secara manual

### Solusi

Menyediakan sistem terintegrasi yang mampu:

* Mencatat transaksi secara real-time
* Mengurangi human error
* Menyediakan laporan otomatis
* Memantau stok barang secara akurat

---

# 3. Scope Produk

## In Scope

* Authentication
* Dashboard
* Manajemen Barang
* Manajemen Kategori
* Manajemen Supplier
* Pembelian Barang
* Penjualan Barang
* Persediaan/Stok
* Laporan
* User Management
* Activity Log
* Theme Management (Light/Dark Mode)

## Out of Scope

* Mobile Application
* Integrasi Marketplace
* Integrasi Akuntansi
* Program Loyalitas Pelanggan
* Modul Pelanggan
* Integrasi Pembayaran Digital
* Multi Cabang

---

# 4. User Roles

## Owner

Hak akses penuh.

Dapat:

* Mengelola seluruh data
* Melihat seluruh laporan
* Mengelola pengguna

## Admin

Dapat:

* Mengelola barang
* Mengelola supplier
* Mengelola pembelian
* Mengelola stok

Tidak dapat:

* Mengelola Owner

## Kasir

Dapat:

* Melakukan transaksi penjualan
* Melihat stok

Tidak dapat:

* Menghapus data master
* Mengelola user

---

# 5. Functional Requirements

---

## Modul 1: Authentication

### Login

Input:

* Username
* Password

Fitur:

* Login
* Logout
* Session Management

Validasi:

* Username wajib
* Password wajib

---

## Modul 2: Dashboard

### Tujuan

Memberikan ringkasan kondisi bisnis.

### Widget Dashboard

#### Kartu Statistik

* Total Penjualan Hari Ini
* Total Transaksi Hari Ini
* Total Barang
* Total Supplier

#### Monitoring

* Stok Menipis
* Produk Terlaris

#### Grafik

* Penjualan Harian
* Penjualan Bulanan

---

## Modul 3: Master Barang

### Data Barang

* ID Barang
* Kode Barang
* Nama Barang
* Kategori
* Satuan
* Harga Beli
* Harga Jual
* Stok
* Minimum Stok
* Supplier

### Fitur

* Tambah Barang
* Edit Barang
* Hapus Barang
* Cari Barang
* Filter Barang
* Lihat Detail Barang

### Validasi

* Kode barang unik
* Harga tidak boleh negatif
* Stok tidak boleh negatif

---

## Modul 4: Kategori Barang

### Data

* ID Kategori
* Nama Kategori
* Deskripsi

### Fitur

* Tambah
* Edit
* Hapus
* Cari

Contoh:

* Semen
* Pasir
* Batu
* Cat
* Besi
* Keramik
* Pipa

---

## Modul 5: Supplier

### Data

* ID Supplier
* Nama Supplier
* Alamat
* Nomor Telepon
* Email

### Fitur

* Tambah Supplier
* Edit Supplier
* Hapus Supplier
* Cari Supplier

---

## Modul 6: Pembelian Barang

### Tujuan

Mencatat barang masuk dari supplier.

### Data Pembelian

Header:

* Nomor Pembelian
* Tanggal
* Supplier

Detail:

* Barang
* Jumlah
* Harga Beli

### Fitur

* Tambah Pembelian
* Lihat Riwayat Pembelian
* Cetak Bukti Pembelian

### Otomatis

Saat pembelian disimpan:

* Stok barang bertambah

---

## Modul 7: Penjualan (Kasir)

### Tujuan

Mencatat transaksi penjualan.

### Alur

1. Kasir mencari barang
2. Menambahkan barang ke keranjang
3. Mengisi jumlah
4. Sistem menghitung subtotal
5. Sistem menghitung total
6. Pembayaran
7. Simpan transaksi
8. Cetak struk

### Data Transaksi

Header:

* Nomor Transaksi
* Tanggal
* Kasir

Detail:

* Barang
* Harga
* Qty
* Subtotal

### Fitur

* Keranjang Belanja
* Hitung Otomatis
* Cetak Struk
* Riwayat Penjualan

### Otomatis

Saat transaksi berhasil:

* Stok berkurang

---

## Modul 8: Manajemen Persediaan

### Tujuan

Mengontrol pergerakan stok.

### Fitur

#### Stok Saat Ini

Menampilkan seluruh stok barang.

#### Stok Masuk

Berasal dari pembelian.

#### Stok Keluar

Berasal dari penjualan.

#### Stock Opname

Penyesuaian stok fisik dengan stok sistem.

### Riwayat Stok

Menyimpan seluruh perubahan stok.

---

## Modul 9: Laporan

### Laporan Penjualan

Filter:

* Harian
* Mingguan
* Bulanan
* Tahunan

Output:

* PDF
* Print

### Laporan Pembelian

Filter:

* Periode
* Supplier

Output:

* PDF
* Print

### Laporan Persediaan

Menampilkan:

* Seluruh stok
* Stok minimum
* Stok habis

### Laporan Produk Terlaris

Menampilkan:

* Ranking produk
* Jumlah penjualan

---

## Modul 10: User Management

### Data User

* Nama
* Username
* Password
* Role

### Fitur

* Tambah User
* Edit User
* Nonaktifkan User

---

## Modul 11: Activity Log

### Tujuan

Audit seluruh aktivitas sistem.

### Aktivitas Yang Dicatat

* Login
* Logout
* Tambah Barang
* Edit Barang
* Hapus Barang
* Pembelian
* Penjualan
* Stock Opname

### Data Log

* Waktu
* User
* Aktivitas
* Detail

---

## Modul 12: Pengaturan Tema

### Theme Mode

#### Light Mode

* Background Putih
* Text Hitam

#### Dark Mode

* Background Hitam
* Text Putih

### Fitur

* Toggle Theme
* Simpan Preferensi User

---

# 6. Non Functional Requirements

## Usability

* Mudah digunakan oleh pengguna non-teknis
* Responsive
* Navigasi sederhana

## Performance

* Dashboard maksimal 3 detik
* Transaksi maksimal 2 detik

## Security

* Password Hashing
* Session Timeout
* Role Based Access Control

## Reliability

* Tidak boleh kehilangan data transaksi
* Validasi form wajib aktif

---

# 7. Desain UI/UX

## Design Style

Monochrome Minimalist

### Warna

Light Mode:

* White (#FFFFFF)
* Black (#000000)
* Gray Scale

Dark Mode:

* Black (#121212)
* White (#FFFFFF)
* Gray Scale

### Karakteristik

* Clean
* Minimal
* Professional
* Flat Design
* Tidak menggunakan warna mencolok

---

# 8. Struktur Navigasi

Dashboard

Master Data

* Barang
* Kategori
* Supplier

Transaksi

* Pembelian
* Penjualan

Persediaan

* Stok Barang
* Stock Opname

Laporan

* Penjualan
* Pembelian
* Persediaan
* Produk Terlaris

Pengguna

* User Management

System

* Activity Log
* Pengaturan Tema

---

# 9. Database Entitas Utama

## Users

* id
* name
* username
* password
* role

## Categories

* id
* name
* description

## Suppliers

* id
* name
* address
* phone
* email

## Products

* id
* code
* name
* category_id
* supplier_id
* purchase_price
* selling_price
* stock
* minimum_stock

## Purchases

* id
* supplier_id
* date

## Purchase_Details

* purchase_id
* product_id
* qty
* price

## Sales

* id
* user_id
* date
* total

## Sales_Details

* sale_id
* product_id
* qty
* price

## Stock_Movements

* id
* product_id
* type
* qty
* date

## Activity_Logs

* id
* user_id
* action
* description
* created_at

---

# 10. Success Criteria

Sistem dianggap berhasil apabila:

* Seluruh transaksi tercatat otomatis
* Stok selalu terupdate
* Laporan dapat dibuat otomatis
* Pengguna dapat menggunakan sistem tanpa pelatihan khusus
* Waktu transaksi lebih cepat dibanding pencatatan manual
