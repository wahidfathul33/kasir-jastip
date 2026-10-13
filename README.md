# Kasir Jastip

Nama aplikasi dapat diganti lewat env `APP_NAME`.

Aplikasi kasir untuk jasa titip (jastip): pencatatan pesanan, nota thermal ala minimarket, dan flag status pesanan.

- Pengaturan: nama toko, produk, periode, data customer
- Status pesanan: Belum Dibayar → Sudah Dibayar → Diproses → Dikirim → Selesai
- Cetak nota 58/80 mm
- Next.js 16 + Neon Postgres + Vercel

## Menjalankan lokal

```bash
cp .env.example .env.local   # isi DATABASE_URL, APP_PASSWORD, AUTH_SECRET
npm install
npm run db:migrate           # membuat tabel
npm run dev
```

## Deploy (Vercel)

Set environment variable `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_PASSWORD`, `AUTH_SECRET`, lalu `vercel deploy --prod`.
