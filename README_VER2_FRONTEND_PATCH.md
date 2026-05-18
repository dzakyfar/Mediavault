# MediaVault Frontend Patch - Branch `ver2`

Patch ini dibuat lokal dari arsip `.rar` yang diupload dan branch lokal sudah diset ke `ver2`.

## Fokus perubahan

- Dark mode global diperbaiki lewat class `dark` / `light` di `<html>` dan persist ke `localStorage`.
- Kontras light mode diperbaiki secara global tanpa rewrite besar-besaran UI original.
- Session mock frontend dibuat per email dengan UID berbeda.
- Login/register mock menyimpan session user lokal, tetapi tombol Google tetap dibiarkan untuk API nanti.
- Dashboard client/freelancer diberi route guard.
- `Switch to Freelancer` / `Switch to Client` tetap ada, tetapi hanya muncul jika user memilih role `both`.
- Logout clear session aktif.
- Smooth page transition dan smooth scroll ditambahkan tanpa database.
- Settings page memakai nama/email dari session aktif agar user seperti Fauzan dan Amelia tidak saling memakai header/profile yang sama.

## Cara tes lokal

```bash
git branch --show-current
# harus: ver2

cd frontend
npm install
npm run build
npm run dev
```

## Alur tes manual yang disarankan

1. Register dengan `fauzan@mail.com`, pilih `freelancer`.
   - Harus masuk dashboard freelancer.
   - Tidak boleh bisa buka `/dashboard/client`.
   - Switch role tidak muncul.

2. Logout, register/login dengan `amelia@mail.com`, pilih `client`.
   - Harus masuk dashboard client.
   - Header/sidebar harus pakai nama Amelia.
   - Tidak boleh bisa buka `/dashboard/freelancer`.

3. Logout, register dengan email lain, pilih `I'm both — Client & Freelancer`.
   - Bisa switch client/freelancer dari sidebar.

4. Toggle dark/light dari navbar dan dashboard.
   - Theme harus tetap setelah refresh.
   - Teks di blok light mode harus tetap terbaca.

## Push ke GitHub branch `ver2`

```bash
git add frontend/src README_VER2_FRONTEND_PATCH.md
git commit -m "fix frontend theme auth flow and role guards"
git push -u origin ver2
```

Catatan: patch ini frontend-only dan tidak menggunakan database/backend.
