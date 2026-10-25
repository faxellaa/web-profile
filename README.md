# Website Profil SMP Muhammadiyah Kembaran

Situs profil SMP Muhammadiyah Kembaran.

## Struktur Halaman

Proyek ini menggunakan App Router Next.js. Setiap menu publik memiliki satu folder route dan wajib memakai nama file `page.tsx`:

```text
app/
  page.tsx              # /
  profil/page.tsx       # /profil
  guru/page.tsx         # /guru
  kesiswaan/page.tsx    # /kesiswaan
  prestasi/page.tsx     # /prestasi
  berita/page.tsx       # /berita
  kontak/page.tsx       # /kontak
  admin/                # area admin, route terpisah
  components/           # komponen bersama, bukan halaman
```

Nama `page.tsx` tidak sebaiknya diubah menjadi `guru.tsx`, karena Next.js hanya otomatis mendaftarkan route dari file khusus bernama `page.tsx`. Struktur menu publik saat ini sudah satu folder per halaman.

## Koneksi Supabase

Client Supabase terpusat berada di `lib/supabase.ts`. Buat file `.env.local` di root proyek berdasarkan `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Nilainya diambil dari Supabase Dashboard > Project Settings > API. Gunakan publishable key atau anon key untuk browser, jangan gunakan `service_role` key di `NEXT_PUBLIC_*` atau di kode frontend.

Setelah mengisi env, restart server development:

```bash
npm run dev
```

Buka `http://localhost:3000`. Query Supabase sudah digunakan oleh halaman beranda, profil, guru, dan dashboard admin. Untuk membuat tabel, jalankan SQL dari `supabase/migrations/` di Supabase SQL Editor atau melalui migration workflow Supabase.

### Menambahkan Fasilitas Lapangan

Jalankan `supabase/migrations/007_add_school_field.sql` di Supabase SQL Editor untuk menambahkan Lapangan. Jika tabel fasilitas hanya berisi sebagian data, jalankan `supabase/migrations/009_seed_default_facilities.sql` untuk menambahkan fasilitas bawaan yang belum ada tanpa membuat duplikat. Halaman publik juga melengkapi data fasilitas yang belum ada dengan daftar bawaan.

### Memperbarui Ekstrakurikuler

Jalankan `supabase/migrations/008_replace_school_extracurriculars.sql` di Supabase SQL Editor untuk mengganti daftar ekstrakurikuler menjadi English Club, IPM, Tapak Suci, Hizbul Wathan, dan Tahsin. Migrasi ini menghapus kegiatan lain yang tidak ada di daftar tersebut dan mengosongkan foto pada tiga nama lama yang disesuaikan. Foto dapat ditambahkan nanti melalui dashboard admin.

### Statistik Kunjungan Realtime

Jalankan migrasi `002_realtime_site_analytics.sql`, `005_weekly_visitor_stats.sql`, lalu `006_unique_visitor_analytics.sql` di Supabase SQL Editor. Migrasi 006 mengganti pencatatan menjadi pengunjung unik per browser/perangkat, mengabaikan localhost, dan mereset data pageview lama agar metrik tidak tercampur. Jalankan migrasi 006 sebelum deploy kode baru. Satu browser/perangkat dihitung maksimal sekali per hari; ini bukan hitungan orang unik, karena satu orang bisa memakai beberapa browser atau perangkat. Log mentah dan ID pengunjung tidak dapat dibaca oleh role publik; fungsi statistik hanya mengembalikan agregat.

Untuk memperbarui nama kepala sekolah pada data tersimpan, jalankan `supabase/migrations/003_update_headmaster_name.sql` di Supabase SQL Editor. Tampilan publik dan admin mengenali nama lama sambil menunggu migrasi diterapkan.

## Perintah

```bash
npm run lint
npm run build
```

Edit halaman di folder `app/`; Next.js akan memperbarui halaman otomatis.
