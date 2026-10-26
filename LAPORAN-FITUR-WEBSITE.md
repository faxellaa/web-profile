# Laporan Fitur dan Tampilan Website

**SMP Muhammadiyah Kembaran — Banyumas**  
**Tanggal laporan:** 26 Oktober 2026  
**Cakupan:** halaman publik/pengguna, panel admin, alur formulir, tampilan, dan integrasi aplikasi.

> Laporan ini merangkum perilaku yang terlihat di kode repository. Keberhasilan konfigurasi produksi tetap bergantung pada Supabase, environment variable, dan deployment Vercel yang aktif.

## 1. Ringkasan

Website menggunakan Next.js App Router dan Supabase untuk menampilkan informasi sekolah, menerima pendaftaran dan surat masuk, serta mengelola konten melalui panel admin.

Fitur utama:

- Informasi profil sekolah, tenaga kerja, sarana, ekstrakurikuler, prestasi, galeri, dan kontak.
- Formulir publik SPMB online dan pengiriman surat masuk.
- Panel admin untuk mengelola data sekolah, galeri, pendaftar, dan surat.
- Login admin dengan Supabase Auth dan pembatasan akses berbasis role.
- Bahasa Indonesia/Inggris dan mode terang/gelap.
- Statistik kunjungan publik.

## 2. Tampilan dan pengalaman pengguna

### Tampilan publik

- Navbar dan footer tampil sebagai bagian dari layout umum; tombol WhatsApp mengambang tersedia di halaman publik.
- Visual memakai judul tebal, aksen biru, kartu dengan border tipis, sudut membulat, latar semi-transparan, blur, dan bayangan ringan.
- Layout menyesuaikan ukuran layar; daftar tertentu memakai carousel horizontal yang bisa digeser.
- Bahasa dapat diganti antara Indonesia dan Inggris. Pilihan bahasa disimpan di browser.
- Mode terang dan gelap tersedia.
- Formulir menggunakan tampilan ringkas dengan status validasi dan pesan pengiriman.

### Tampilan panel admin

- Navbar admin berada di bagian atas dengan menu desktop/mobile, submenu, identitas sekolah, tombol tema, dan logout.
- Menu dikelompokkan menjadi data sekolah dan layanan publik.
- Daftar pendaftar dan surat masuk disajikan sebagai tabel ringkas; detail dapat dibuka tanpa membuat daftar utama terlalu panjang.
- Form pengelolaan konten memakai modal dan field gambar bersama.

## 3. Fitur publik

### Beranda — `/`

Beranda berisi beberapa bagian berikut:

1. **Hero/intro sekolah** dengan judul utama.
2. **Sambutan kepala sekolah**, termasuk foto, isi sambutan, dan identitas kepala sekolah.
3. **Visi dan misi** dalam panel yang dapat dibuka/tutup.
4. **Tenaga kerja** berupa kartu profil guru/staf.
5. **Sarana dan prasarana** berupa kartu fasilitas.
6. **Ekstrakurikuler** berupa kartu kegiatan.
7. **Prestasi** berupa kartu prestasi.
8. **Statistik pengunjung**, termasuk ringkasan dan tren tujuh hari bila datanya tersedia.
9. **Layanan publik**, dengan tautan menuju formulir SPMB dan surat masuk.

Bagian Tenaga Kerja, Sarana, Ekstrakurikuler, dan Prestasi di beranda menampilkan maksimal lima konten, lalu satu kartu **Lihat Selengkapnya** di ujung carousel. Kartu tersebut menuju halaman daftar lengkap. Statistik berada setelah Prestasi.

Konten beranda mengambil data dari Supabase. Beberapa data memiliki nilai default/fallback agar bagian terkait tetap dapat menampilkan konten saat data database tidak lengkap.

### Halaman profil dan informasi sekolah

- **`/profil`** — profil sekolah.
- **`/profil/sarana-prasarana`** — daftar fasilitas dalam kartu berisi foto, nama, dan deskripsi; data fasilitas dapat dilengkapi dengan data default.
- **`/guru`** — direktori guru/staf.
- **`/kesiswaan`** — informasi kesiswaan.
- **`/prestasi`** — daftar prestasi siswa.
- **`/akademik/ekstrakurikuler`** — daftar kegiatan ekstrakurikuler, termasuk kategori/badge, deskripsi, dan gambar bila tersedia.
- **`/kontak`** — informasi kontak sekolah.

### Galeri

- **`/galeri/foto`** — galeri foto publik.
- **`/galeri/video`** — galeri video. Video dikelola menggunakan tautan YouTube, bukan dengan mengunggah file video.

### Formulir SPMB online — `/layanan-publik/spmb-online`

Form pendaftaran mengumpulkan data calon murid dan orang tua/wali, termasuk nama, nomor WhatsApp berawalan 62 dengan panjang 12–13 digit, asal sekolah, tempat/tanggal lahir, NIK, persetujuan orang tua/wali, dan dokumen yang diminta form.

- Isian dan dokumen divalidasi di browser dan API.
- Form meminta dua dokumen; jenis yang diterima mencakup PDF, DOC, DOCX, JPG, PNG, dan WebP. Batas ukuran masing-masing dokumen adalah 10 MB.
- Dokumen diunggah langsung ke Supabase Storage menggunakan signed upload URL, lalu metadata pendaftaran dikirim ke API. Pola ini menghindari pengiriman seluruh berkas melalui payload Vercel Functions.
- Setelah proses berhasil, halaman menampilkan konfirmasi dan tautan/tombol WhatsApp untuk komunikasi dengan panitia. Panel sukses tidak lagi menampilkan tombol untuk memulai pendaftaran lain.
- Jika hasil pengiriman tidak dapat dipastikan karena gangguan koneksi/timeout, pengguna diberi instruksi untuk memastikan status kepada panitia sebelum mencoba kembali.

### Formulir surat masuk — `/layanan-publik/surat-masuk`

Formulir ini digunakan untuk mengirim surat ke administrasi sekolah. Isian mencakup nama pengirim, instansi, nomor WhatsApp aktif berawalan 62 dengan panjang 12–13 digit, nomor dan tanggal surat, tujuan, perihal, ringkasan/isi surat, serta lampiran.

- Isian dan lampiran wajib diisi.
- Lampiran menerima foto, PDF, DOC, dan DOCX, dengan batas 5 MB.
- Form mengirim data dan lampiran ke endpoint server. Setelah berhasil, form direset, modal tertutup otomatis, lalu notifikasi sukses tampil di tengah layar dengan kartu lebih lebar dan teks rata tengah. Notifikasi mengonfirmasi bahwa surat/lampiran diterima serta akan diperiksa dan diteruskan oleh administrasi sekolah.
- Tombol Kirim Surat berada di sisi kanan dan berwarna biru; tombol pemilih file menggunakan aksen biru yang konsisten dengan formulir SPMB.

## 4. Fitur panel admin

Semua halaman admin selain login dan alur pemulihan password dilindungi oleh guard akses. Akun harus memiliki sesi Supabase dan `app_metadata.role` bernilai `admin`.

### Login dan akun

- **`/admin/login`** — masuk dengan email dan password Supabase; password dapat ditampilkan/disembunyikan.
- **`/admin/lupa-password`** — meminta tautan reset password.
- **`/admin/reset-password`** — menyimpan password baru; kedua kolom password memiliki tombol mata untuk menampilkan/menyembunyikan isi.
- Akun Supabase yang baru dibuat tidak otomatis menjadi admin. Role admin diberikan terpisah melalui `app_metadata`.

### Dashboard dan pengelolaan data sekolah

- **`/admin/dashboard`** — halaman dashboard dan akses ke menu pengelolaan.
- **`/admin/prestasi`** — membuat, mengubah, dan menghapus data prestasi/artikel serta gambar.
- **`/admin/guru-staff`** — mengelola data guru dan staf.
- **`/admin/ekstrakulikuler`** — CRUD kegiatan, termasuk nama, kategori/badge, deskripsi, dan gambar.
- **`/admin/sarana-prasarana`** — CRUD fasilitas beserta gambar.
- **`/admin/galeri/foto`** — mengelola item galeri foto.
- **`/admin/galeri/video`** — mengelola galeri video melalui tautan.
- **`/admin/galeri`** dan **`/admin/berita`** masih tersedia sebagai route lama/pengarah.

### Pengelolaan layanan publik

- **`/admin/spmb`** — melihat daftar pendaftar, mencari/memfilter dan berpindah halaman, membuka detail, melihat atau mengunduh dokumen, mengubah status, serta menghapus data sesuai akses admin. Status yang digunakan: `Baru`, `Diverifikasi`, dan `Diterima`.
- **`/admin/surat-masuk`** — melihat daftar surat, memfilter status, membuka detail, melihat atau mengunduh lampiran, dan memperbarui status (`Baru`, `Diproses`, `Selesai`).
- Daftar Surat Masuk menggunakan tabel satu baris per surat dengan detail yang dapat dibuka.
- Ekspor Surat Masuk tersedia sebagai spreadsheet Excel `.xlsx` setelah terkumpul 10 surat. Spreadsheet memuat kolom data formulir dan tautan lampiran signed URL yang berlaku terbatas.

## 5. Data, API, dan kontrol akses

### Supabase dan tabel

Repository menggunakan Supabase untuk autentikasi, penyimpanan berkas, query konten, dan kebijakan akses. Tabel yang digunakan mencakup:

- `articles`
- `teachers`
- `extracurriculars`
- `facilities`
- `school_stats`
- `school_gallery_items`
- `spmb_applications`
- `incoming_letters`
- tabel statistik kunjungan dan log aktivitas admin

### Penyimpanan berkas

- **`school-media`** — media sekolah; publik untuk dibaca, tetapi upload/perubahan/penghapusan dibatasi kepada admin.
- **`spmb-documents`** — bucket private untuk dokumen pendaftar SPMB.
- **`incoming-mail-attachments`** — bucket private untuk lampiran surat masuk.

Dokumen private diakses admin melalui izin atau tautan sementara; lampiran tidak dimaksudkan sebagai URL publik permanen.

### API

- **`POST /api/spmb`** — menyiapkan signed upload URL dan memproses metadata pendaftaran; memvalidasi data dan dokumen.
- **`POST /api/surat-masuk`** — menerima data formulir dan lampiran; membatasi origin dan ukuran request, serta menggunakan honeypot untuk mengurangi pengiriman bot.
- Endpoint server membutuhkan konfigurasi secret Supabase di lingkungan server. Secret tidak boleh dipasang sebagai variabel `NEXT_PUBLIC_*`.

### Hak admin

Pemeriksaan role dilakukan di antarmuka dan juga melalui kebijakan Row Level Security (RLS) Supabase. Akun yang hanya terdaftar di Supabase Auth belum tentu memiliki izin admin. Referensi aturan tersebut ada pada [AdminAccessGuard](./app/admin/components/AdminAccessGuard.tsx), [panduan Supabase](./supabase/README.md), dan [migrasi akses admin](./supabase/migrations/010_school_media_and_admin_access.sql).

### Statistik pengunjung

Pelacak kunjungan mencatat route publik, tetapi mengecualikan route `/admin` dan hostname localhost. Perhitungan unik didasarkan pada browser/perangkat dan hari, sehingga bukan penghitungan orang unik secara pasti. Grafik mingguan hanya dapat ditampilkan jika data statistik tersedia.

## 6. Batas laporan

Laporan ini menjelaskan apa yang didefinisikan oleh source code dan migrasi repository. Tanpa akses ke Supabase dan Vercel produksi, laporan ini tidak memastikan:

- apakah semua environment variable dan secret sudah terpasang dengan benar;
- apakah semua migrasi telah diterapkan pada project Supabase aktif;
- apakah bucket dan policy produksi sama dengan definisi di repository;
- apakah suatu akun tertentu sudah diberi role admin;
- apakah database produksi sudah memiliki data yang diharapkan;
- apakah formulir, email pemulihan password, dan statistik berhasil beroperasi pada deployment aktif;
- status build/deployment Vercel atau konfigurasi domain dan redirect URL.

## 7. Referensi implementasi

- [Beranda](./app/page.tsx)
- [Form SPMB](./app/components/SpmbRegistrationForm.tsx)
- [Form Surat Masuk](./app/components/IncomingMailForm.tsx)
- [API SPMB](./app/api/spmb/route.ts)
- [API Surat Masuk](./app/api/surat-masuk/route.ts)
- [Navigasi admin](./app/admin/components/navbar.tsx)
- [Guard akses admin](./app/admin/components/AdminAccessGuard.tsx)
- [Daftar SPMB admin](./app/admin/menu-navbar/spmb.tsx)
- [Daftar Surat Masuk admin](./app/admin/menu-navbar/surat-masuk.tsx)
- [README Supabase](./supabase/README.md)
