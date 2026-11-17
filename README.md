# Code the Robot

Game puzzle pemrograman berbasis web. Susun blok perintah, jalankan, dan antar robot ke bendera.
Dibangun dengan React, Phaser 3, dan TypeScript. Tidak butuh server: hasil build adalah situs statis.

## Perintah

```bash
bun install           # pasang dependency
bun run dev           # jalankan lokal (opsi uji "Unlock all levels" aktif di sini)
bun run typecheck     # periksa TypeScript
bun test              # jalankan semua tes
bun run build         # build produksi ke dist/
bun run release:check # periksa dist/ sebelum rilis
bun run preview       # coba hasil build secara lokal
```

## Konfigurasi (`.env`)

Salin `.env.example` menjadi `.env`, lalu isi:

| Variabel | Arti |
| --- | --- |
| `VITE_SITE_URL` | Alamat situs final, wajib https, tanpa garis miring di akhir. Dipakai untuk canonical, sitemap, dan robots.txt. |
| `VITE_ADS_MODE` | `off` (tanpa iklan), `test` (iklan uji), atau `live` (iklan nyata). |
| `VITE_ADSENSE_CLIENT` | ID penerbit, bentuk `ca-pub-1234567890123456`. |
| `VITE_ADSENSE_SLOT_WORLD`, `VITE_ADSENSE_SLOT_PLAY` | ID unit iklan banner (angka). Kosong = banner di tempat itu tidak tampil. |

Variabel `VITE_*` ditanam saat build. Ubah nilainya, lalu build ulang.

## Yang wajib diedit sebelum rilis

1. `src/site/siteInfo.ts`: `OPERATOR_NAME`, `CONTACT_EMAIL`, dan `LAST_UPDATED`.
2. `public/ads.txt`: ganti `pub-0000000000000000` dengan ID penerbit Anda (hanya jika memakai AdSense).
3. `public/og-image.png`: ekspor `public/og-image.svg` menjadi PNG 1200×630.
4. `.env`: `VITE_SITE_URL` dan, jika memakai iklan, mode serta ID.

Lalu jalankan `bun run build` dan `bun run release:check`. Error berarti jangan rilis dulu.

## Deployment (situs statis)

Folder yang diunggah adalah `dist/`. Server harus menyajikan `index.html` untuk alamat yang tidak ditemukan.
Berkas `public/_redirects` dan `public/_headers` (Netlify, Cloudflare Pages) serta `vercel.json` (Vercel) sudah menyiapkannya.

**Cloudflare Pages atau Netlify (disarankan, dari repositori Git)**
1. Unggah proyek ke repositori GitHub.
2. Buat proyek baru dari repositori itu.
3. Perintah build: `bun run build`. Folder output: `dist`.
4. Isi variabel lingkungan `VITE_*` di pengaturan proyek.
5. Pasang domain Anda, lalu jalankan ulang build bila `VITE_SITE_URL` berubah.

**Vercel**: sama, dengan Framework Preset "Vite"; output `dist`.

**Unggah langsung tanpa Git**: jalankan build di perangkat Anda, lalu unggah isi `dist/` lewat fitur unggah manual (Netlify Drop atau Direct Upload Cloudflare Pages).

**GitHub Pages**: berfungsi hanya jika situs berada di akar domain (domain sendiri atau `nama.github.io`). Alamat di dalam subfolder repositori memerlukan pengaturan `base` Vite dan router yang tidak disiapkan di proyek ini. GitHub Pages memakai `404.html` sebagai fallback, sehingga alamat halaman dalam game dijawab dengan kode status 404. Itu merugikan SEO, jadi pilih hosting lain untuk situs publik.

## Setelah rilis

- Kirim `https://domain-anda/sitemap.xml` ke Google Search Console.
- Pastikan `https://domain-anda/ads.txt` dan `/robots.txt` terbuka.
- Buka Console browser dan periksa pesan `Content-Security-Policy-Report-Only`. Kebijakan di `_headers` hanya mencatat, tidak memblokir. Perketat hanya setelah iklan live terbukti berjalan.
- Ukur kecepatan dengan PageSpeed Insights (mode ponsel).

## Daftar uji manual

Ukuran layar: 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080.

- Setiap halaman terbuka tanpa scroll horizontal.
- Menyelesaikan level: bintang, koin, dan level berikutnya terbuka. Muat ulang halaman dan progres tetap ada.
- Pause, Resume, Step, Reset, Undo, Redo, dan drag and drop di layar sentuh.
- Daily, Endless, Time, dan Minimum bisa dimainkan dan memberi hadiah satu kali.
- Pengaturan: suara, musik, dan animasi mati bekerja. Reset progress mengosongkan semuanya.
- Keyboard: Tab menjangkau semua kontrol, dialog mengurung fokus, Escape menutup dialog.
- Iklan mode `test`: interstitial setelah 3 level, rewarded memberi hadiah hanya jika ditonton penuh, suara dibisukan saat iklan.

## Batasan yang diketahui

- Progres tersimpan di perangkat. Berganti browser atau perangkat berarti mulai dari awal.
- Papan permainan digambar di kanvas dan tidak dapat dibaca pembaca layar. Kontrol dan pesan status tersedia lewat editor perintah.
- Halaman konten (How to Play, About, dan lainnya) hanya berbahasa Inggris.