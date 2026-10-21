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

### Statistik Kunjungan Realtime

Jalankan `supabase/migrations/002_realtime_site_analytics.sql` di Supabase SQL Editor untuk mengaktifkan pencatatan kunjungan dan pembaruan Realtime. Statistik menghitung page view halaman publik, bukan pengunjung unik, dan mulai dihitung sejak migrasi ini aktif; tidak ada angka historis yang dibuat-buat. Log mentah tidak dapat dibaca oleh role publik, sementara agregat saja yang dibaca halaman Home.

Untuk memperbarui nama kepala sekolah pada data tersimpan, jalankan `supabase/migrations/003_update_headmaster_name.sql` di Supabase SQL Editor. Tampilan publik dan admin mengenali nama lama sambil menunggu migrasi diterapkan.

## Perintah

```bash
npm run lint
npm run build
```

Edit halaman di folder `app/`; Next.js akan memperbarui halaman otomatis.
