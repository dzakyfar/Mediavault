# MediaVault - Kondisi Project Terkini

Terakhir diperbarui: 7 Juni 2026

Dokumen ini adalah catatan status project MediaVault berdasarkan kondisi kode di folder `Mediavault`, histori perubahan, dan verifikasi terakhir. Untuk dokumentasi teknis detail per teknologi, arsitektur, folder, file, komponen, endpoint, dan model data, baca juga `TECHNICAL_DOCUMENTATION.md`.

## Ringkasan Project

MediaVault adalah aplikasi marketplace freelance multimedia full-stack untuk mempertemukan client dengan freelancer kreatif. Sistem mendukung pencarian freelancer, post job, apply/request job, order jasa dari public profile, chat, notification, project tracking, draft review, portfolio multi-media, katalog jasa/rate freelancer, review/rating, upload media ke S3/local fallback, Google Sign-In, JWT auth, Telegram notification, KlikQRIS payment, wallet internal, dan withdrawal request.

Project saat ini bukan lagi mock-only. Frontend dan backend sudah saling terhubung melalui API Express + Prisma + PostgreSQL.

## Stack Utama

- Frontend: React, Vite, TypeScript/TSX, React Router, Tailwind CSS, Radix UI/shadcn-style components, lucide-react.
- Backend: Node.js, Express, Prisma ORM, PostgreSQL.
- Auth: JWT untuk session aplikasi, bcryptjs untuk password, Google Identity Services + `google-auth-library` untuk Google Sign-In.
- Upload: AWS S3 presigned URL, backend direct upload fallback, local fallback folder `backend/uploads-local`.
- Notification: database notification, unread counter, Telegram bot notification.
- Payment: KlikQRIS integration, internal wallet, escrow-like settlement, withdrawal request, auto-release job.
- Local database: PostgreSQL via Docker Compose.
- Deployment: GitHub Actions CI/CD, frontend S3/CloudFront, backend EC2 + PM2 + Docker PostgreSQL.

## Status Verifikasi Terakhir

Perintah yang terakhir dijalankan dan lolos:

```bash
cd frontend
npm run build
```

```bash
cd backend
npx prisma validate
```

```bash
node --check backend/**/*.js
```

Catatan:

- Frontend production build berhasil.
- 44 file JavaScript backend lolos syntax check.
- Prisma schema valid.
- Vite masih memberi warning ukuran chunk lebih dari 500 kB. Itu bukan error build, tetapi bisa dioptimasi nanti dengan code splitting/manual chunks.
- Tidak ada perubahan pada folder `.github/workflows` pada pekerjaan terakhir.

## Perubahan Terkini Yang Sudah Masuk

- Dashboard freelancer sekarang menampilkan `averageRating`, `reviewCount`, dan `completedProjects` dari backend, bukan hardcoded.
- Public profile dan dashboard memakai sumber review yang sama, yaitu tabel `FreelancerReview`.
- Statistik dashboard client/freelancer sudah diperbaiki agar tidak dihitung dari 5 item terbaru saja.
- `activeProjects`, `filesReady`, `openRequests`, dan `completedProjects` sekarang dihitung melalui query database terpisah.
- Freelancer dengan status `Busy` tidak lagi dianggap belum onboarding.
- Sidebar switch role tidak lagi menganggap `isAvailable=false` sebagai profil freelancer belum lengkap.
- Endpoint message backend sekarang ikut memblokir pesan baru ke freelancer yang `Busy`, kecuali pengirim sudah punya project aktif dengan freelancer tersebut.
- Link notifikasi pesan diarahkan ke dashboard sesuai role penerima.
- Legacy code portfolio/offering yang tidak dirender di `freelancer/SettingsPage.tsx` sudah dibersihkan. UI aktif tidak diubah.
- Copy kecil yang tidak konsisten seperti `Memuat project` sudah dirapikan menjadi `Memuat proyek`.
- Push notification browser tidak dipakai. Notifikasi eksternal yang dipakai adalah Telegram.

## Cara Menjalankan Local

1. Jalankan PostgreSQL:

```bash
docker compose up -d db
```

2. Jalankan backend:

```bash
cd backend
npm install
npm run prisma:dev
npm run seed:dummy
npm run dev
```

3. Jalankan frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- Database: `postgresql://mediavault:mediavaultpass@localhost:5433/mediavault_dev`

Jika backend error `EADDRINUSE`, port `5000` sedang dipakai proses lain.

## Environment Backend

File acuan: `backend/.env.example`.

Variable penting:

- `DATABASE_URL`: koneksi PostgreSQL.
- `JWT_SECRET`: secret JWT, wajib kuat untuk production.
- `JWT_EXPIRES_IN`: masa berlaku token, contoh `7d`.
- `GOOGLE_CLIENT_ID`: OAuth client ID Google, harus sama dengan frontend.
- `PORT`: port backend, default `5000`.
- `NODE_ENV`: `development` atau `production`.
- `PUBLIC_APP_URL`: URL frontend untuk link Telegram/dashboard.
- `CORS_ORIGINS`: daftar origin frontend yang diizinkan.
- `AWS_REGION`: region S3.
- `AWS_S3_BUCKET` atau `AWS_S3_BUCKET_MEDIA`: bucket media.
- `AWS_ACCESS_KEY_ID` dan `AWS_SECRET_ACCESS_KEY`: IAM key media upload.
- `AWS_S3_ENDPOINT` dan `AWS_S3_FORCE_PATH_STYLE`: opsional untuk S3-compatible storage.
- `TELEGRAM_BOT_TOKEN`: token bot Telegram.
- `TELEGRAM_BOT_USERNAME`: username bot Telegram.
- `TELEGRAM_BOT_MODE`: `polling` untuk HTTP/local, `webhook` untuk HTTPS.
- `TELEGRAM_POLLING_INTERVAL_MS`: interval polling.
- `TELEGRAM_WEBHOOK_SECRET`: secret header webhook Telegram.
- `KLIKQRIS_MODE`: `sandbox` atau `production`.
- `KLIKQRIS_API_KEY`: credential KlikQRIS.
- `KLIKQRIS_MERCHANT_ID`: merchant ID KlikQRIS.
- `KLIKQRIS_BASE_URL`: base URL API KlikQRIS.

Catatan:

- Jangan commit `.env`.
- IAM key media sebaiknya khusus untuk bucket media, bukan key deploy frontend.
- Telegram webhook wajib HTTPS.
- Jika backend masih HTTP, gunakan Telegram polling.

## Environment Frontend

File acuan: `frontend/.env.example`.

Variable penting:

- `VITE_API_URL`: URL backend API.
- `VITE_GOOGLE_CLIENT_ID`: OAuth client ID Google.

Untuk local:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Untuk production:

```env
VITE_API_URL=https://api-domain-production/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Catatan:

- Setelah mengubah `.env`, restart Vite.
- Authorized JavaScript origins Google harus mencakup `http://localhost:5173` dan domain production seperti `https://mediavault.studio`.

## Akun Dummy

Seeder: `backend/prisma/seedDummy.js`.

Perintah:

```bash
cd backend
npm run seed:dummy
```

Password semua akun dummy:

```text
12345678
```

Akun:

- `rania.client@mediavault.test` - CLIENT
- `bima.client@mediavault.test` - CLIENT
- `raka.photo@mediavault.test` - FREELANCER
- `maya.visual@mediavault.test` - FREELANCER
- `dion.studio@mediavault.test` - FREELANCER, status unavailable/busy
- `nadia.hybrid@mediavault.test` - BOTH

Catatan:

- Seeder menghapus seluruh data sebelum membuat data dummy baru.
- Jangan jalankan seeder pada database production yang berisi data penting.
- Saldo dummy berasal dari seed wallet, bukan selalu dari project earning. Contoh `nadia.hybrid@mediavault.test` memiliki saldo awal role `BOTH`.

## Alur Auth Dan Role

- Register biasa membuat user dengan email, password, nama, dan nomor telepon.
- Login biasa memakai email/password.
- Google login memakai Google Identity Services di frontend dan verifikasi token Google di backend.
- User baru dari Google wajib menyetujui Terms of Service + Privacy Policy, memasukkan nomor telepon, dan membuat password lokal.
- Session aplikasi tetap berbasis JWT MediaVault.
- Token disimpan di `localStorage` dengan key `mediavault_token`.
- Role yang dipakai: `CLIENT`, `FREELANCER`, `BOTH`.
- Role `ADMIN` sudah ada di schema, tetapi UI admin belum tersedia.
- User baru diarahkan ke role select.
- Freelancer harus menyelesaikan onboarding sebelum masuk dashboard freelancer.
- Status availability tidak lagi menjadi syarat onboarding. Freelancer boleh `Busy` tetapi tetap bisa masuk dashboard.

## Alur Client

Client dapat:

- Melihat dashboard ringkasan project, pembayaran, saldo, file review, pesan, dan rekomendasi freelancer.
- Post job baru melalui `/post-job`.
- Mengisi title, deskripsi, kategori, jasa, budget, tanggal, deadline, wilayah, alamat detail, koordinat, dan reference files.
- Menggunakan alamat profile yang tersimpan atau menentukan titik lewat map draggable.
- Melihat request freelancer.
- Accept/decline application.
- Membayar melalui QRIS atau wallet.
- Melihat payment detail.
- Review submission/draft freelancer.
- Approve hasil atau meminta revisi.
- Memberi rating dan ulasan setelah project selesai.
- Chat dengan freelancer.
- Mengatur profile, password, bahasa, avatar, Telegram, dan delete account.

## Alur Freelancer

Freelancer dapat:

- Melihat dashboard ringkasan project, pending earning, balance, request baru, unread message, rating, dan completed projects.
- Melihat job request yang masih open.
- Apply/request job.
- Cancel application selama masih pending.
- Menerima atau menolak order yang sudah dibayar client.
- Mengubah progress project.
- Mengirim draft/submission dengan file dan komentar.
- Mengelola portfolio item.
- Mengelola katalog jasa/rate melalui halaman portfolio.
- Melihat earning/wallet.
- Mengajukan withdrawal request.
- Chat dengan client jika flow project mengizinkan.
- Mengatur profile, availability, password, bahasa, avatar, Telegram, dan delete account.

## Busy Freelancer Dan Message

Aturan terbaru:

- Freelancer yang `Busy` tidak menerima pesan/order baru dari public profile.
- Frontend public profile men-disable tombol contact/order untuk freelancer busy.
- Backend `POST /api/messages` juga memblokir pesan baru ke freelancer busy.
- Pengecualian: client yang sudah punya project aktif dengan freelancer tersebut tetap bisa mengirim pesan untuk kebutuhan project berjalan.

Ini penting karena UI saja tidak cukup. Endpoint juga harus menjaga alur agar tidak bisa ditembus lewat direct API.

## Alur Project

1. Client membuat job.
2. Freelancer apply/request job.
3. Client accept/decline freelancer.
4. Jika accepted, project masuk alur payment.
5. Client membayar via QRIS atau wallet.
6. Setelah payment sukses, project menunggu konfirmasi freelancer.
7. Freelancer menerima order dan mulai bekerja.
8. Freelancer update progress.
9. Freelancer mengirim submission/draft beserta file dan komentar.
10. Client approve atau request revision.
11. Jika approve, settlement berjalan dan dana masuk wallet freelancer.
12. Jika revision, project kembali ke pengerjaan.
13. Setelah selesai, client dapat memberi rating/review.

## Payment, Wallet, Dan Earnings

Konsep:

- `Estimated Earnings`: estimasi pendapatan yang masih pending, dihitung dari invoice project freelancer yang statusnya `PENDING`.
- `Available Balance`: saldo wallet yang sudah tersedia.
- `Completed Projects`: jumlah project freelancer yang sudah `COMPLETED`.
- `Average Rating`: rata-rata dari tabel `FreelancerReview`.

Sistem saat ini:

- Payment QRIS memakai KlikQRIS.
- Payment status dapat dicek dari backend.
- Webhook KlikQRIS tersedia.
- Wallet internal tersedia untuk client dan freelancer.
- Pay with wallet tersedia.
- Withdrawal request tersedia.
- Settlement project membuat transaksi wallet dan revenue platform.
- Auto-release job berjalan untuk submission yang melewati waktu approve otomatis.

Catatan:

- Withdrawal masih request internal, belum transfer bank/e-wallet otomatis.
- Payment perlu diuji dengan credential KlikQRIS sandbox/production valid sebelum final production.

## Upload Media Dan S3

Scope upload:

- `avatar`: PNG/JPEG maksimal 1MB.
- `message-image`: PNG/JPEG maksimal 1MB.
- `portfolio`: PNG/JPEG maksimal 1MB per gambar, MP4/MOV/WebM maksimal 100MB per video.
- `project-reference`: maksimal 100MB per file.
- `project-submission`: PNG/JPEG/PDF/MP4/MOV/WebM maksimal 500MB per file.

Aturan portfolio:

- Tidak ada batas jumlah portfolio item global di kode.
- Satu portfolio item maksimal 5 gambar dan 1 video.
- Gambar maksimal 1MB per file.
- Video maksimal 100MB per file.

Alur upload:

- Frontend mencoba upload via presigned S3 URL.
- Jika gagal dan file <= 100MB, frontend fallback ke backend direct upload.
- Backend direct upload menyimpan ke S3 jika konfigurasi lengkap.
- Jika S3 tidak siap, backend fallback ke `backend/uploads-local`.
- Private file dapat diakses kembali melalui signed download URL.

Catatan:

- Folder `uploads/` di S3 baru muncul jika ada object berhasil masuk.
- S3 CORS origin tidak boleh memakai trailing slash.
- Sistem belum punya cleanup orphan object otomatis.
- Sistem belum menghitung total quota bucket 5GB secara real-time.

## Telegram Notification

Status:

- Telegram notification tersedia di settings client dan freelancer.
- User bisa connect, sync, enable, disable, disconnect.
- Frontend menampilkan command `/start <token>` dan mencoba copy ke clipboard.
- Backend memproses `/start` dari Telegram updates.
- Mode `polling` cocok untuk local/HTTP.
- Mode `webhook` cocok untuk backend HTTPS.
- Telegram message untuk notifikasi pesan tidak mengirim isi chat lengkap, hanya memberi tahu ada pesan baru.

Catatan:

- Telegram webhook wajib HTTPS.
- Jangan jalankan polling lebih dari satu instance bot.
- Jika muncul error `409 Conflict`, ada instance lain yang sedang polling.

## Route Frontend

Public:

- `/`
- `/login`
- `/register`
- `/role-select`
- `/explore`
- `/about`
- `/success-stories`
- `/freelancer/:id`

Client:

- `/dashboard/client`
- `/dashboard/client/projects`
- `/dashboard/client/projects/:id`
- `/dashboard/client/find-freelancer`
- `/dashboard/client/messages`
- `/dashboard/client/notifications`
- `/dashboard/client/payments`
- `/dashboard/client/payments/:id`
- `/dashboard/client/settings`
- `/post-job`

Freelancer:

- `/dashboard/freelancer`
- `/dashboard/freelancer/requests`
- `/dashboard/freelancer/projects`
- `/dashboard/freelancer/projects/:id`
- `/dashboard/freelancer/portfolio`
- `/dashboard/freelancer/earnings`
- `/dashboard/freelancer/messages`
- `/dashboard/freelancer/notifications`
- `/dashboard/freelancer/settings`
- `/freelancer-onboarding`

Fallback:

- `*` Not Found page.

## Endpoint Backend

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/role`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`
- `DELETE /api/auth/me`
- `POST /api/auth/freelancer-registration`
- `POST /api/auth/register-freelancer`

Dashboard:

- `GET /api/dashboard/client`
- `GET /api/dashboard/freelancer`

Projects:

- `GET /api/projects/mine`
- `POST /api/projects`
- `GET /api/projects/open`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `PATCH /api/projects/:projectId/progress`
- `POST /api/projects/:projectId/submissions`
- `PATCH /api/projects/:projectId/submissions/:submissionId`
- `POST /api/projects/:projectId/review`
- `POST /api/projects/:projectId/apply`
- `PATCH /api/projects/applications/:applicationId/cancel`
- `PATCH /api/projects/applications/:applicationId`
- `PATCH /api/projects/:projectId/freelancer-confirm`
- `PATCH /api/projects/:projectId/freelancer-reject`

Freelancers:

- `GET /api/freelancers`
- `GET /api/freelancers/:id`
- `POST /api/freelancers/:id/order`

Messages:

- `GET /api/messages`
- `GET /api/messages/unread-count`
- `POST /api/messages`
- `PATCH /api/messages/read`

Notifications:

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:notificationId/read`

Portfolio:

- `GET /api/portfolio/mine`
- `POST /api/portfolio`
- `PATCH /api/portfolio/:id`
- `DELETE /api/portfolio/:id`

Offerings:

- `GET /api/offerings/mine`
- `POST /api/offerings`
- `PATCH /api/offerings/:id`
- `DELETE /api/offerings/:id`

Uploads:

- `POST /api/uploads/presign`
- `POST /api/uploads/direct`
- `GET /api/uploads/download-url`

Payments:

- `POST /api/payments/webhook/klikqris`
- `GET /api/payments/mine`
- `GET /api/payments/detail/:paymentId`
- `POST /api/payments/projects/:projectId/create`
- `POST /api/payments/projects/:projectId/pay-with-wallet`
- `GET /api/payments/projects/:projectId/current`
- `GET /api/payments/:klikqrisOrderId/status`

Wallet:

- `GET /api/wallet/me`
- `GET /api/wallet/escrow`
- `POST /api/wallet/withdrawals`

Telegram:

- `POST /api/telegram/webhook`
- `GET /api/telegram/status`
- `POST /api/telegram/connect`
- `POST /api/telegram/sync-pending`
- `PATCH /api/telegram/settings`
- `DELETE /api/telegram/disconnect`

Health:

- `GET /api/health`

## Database Model

Model Prisma:

- `User`
- `Project`
- `Offering`
- `ProjectApplication`
- `PortfolioItem`
- `PortfolioMedia`
- `ProjectFile`
- `FreelancerReview`
- `ProjectSubmission`
- `Invoice`
- `Payment`
- `Wallet`
- `WalletTransaction`
- `Withdrawal`
- `PlatformRevenue`
- `Message`
- `ProjectHistory`
- `Notification`

Enum penting:

- `UserRole`: `CLIENT`, `FREELANCER`, `BOTH`, `ADMIN`
- `ProjectStatus`: `DRAFT`, `OPEN`, `IN_PROGRESS`, `CONFIRMED`, `PAID`, `UNDER_REVIEW`, `WAITING_PAYMENT`, `DELIVERED`, `COMPLETED`, `AUTO_COMPLETED`, `DISPUTED`, `CANCELLED`
- `ApplicationStatus`: `PENDING`, `ACCEPTED`, `REJECTED`
- `NotificationType`: `INFO`, `PROJECT`, `PAYMENT`, `MESSAGE`
- `ProjectSubmissionStatus`: `PENDING`, `APPROVED`, `REVISION_REQUESTED`
- `PaymentStatus`: `PENDING`, `PAID`, `EXPIRED`, `FAILED`
- `WithdrawalStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- `WalletMutationType`: `CREDIT`, `DEBIT`

## UI/UX Status

Sudah tersedia:

- Dark/light mode.
- Bahasa Indonesia/English.
- Sidebar dashboard dengan badge unread message/notification.
- Navbar dashboard dengan notification count.
- Avatar default berbasis inisial.
- Landing page dengan hero, catalog, voices/testimonials, footer, CS floating button.
- About Us page.
- Success Stories page.
- Contact popup theme-aware.
- Terms of Service dan Privacy Policy modal.
- Public freelancer profile dengan portfolio modal dan pricelist.
- Post job dengan map draggable dan region selection.
- Message center shared untuk client/freelancer.
- Notification center shared untuk client/freelancer.
- Telegram settings card.
- Password change card dengan captcha sederhana.
- Delete account modal frontend.

## File Dokumentasi Tambahan

- `read.md`: catatan kondisi project, cara jalan, alur, endpoint, status, risiko.
- `TECHNICAL_DOCUMENTATION.md`: dokumentasi teknis detail tentang teknologi, arsitektur, fungsi folder/file, komponen, model, dan alur sistem.

## Risiko Dan Technical Debt

- Belum ada automated unit/integration/e2e test.
- CI belum menjalankan test karena test runner belum tersedia.
- Message dan notification masih polling/event refresh, belum WebSocket/SSE.
- S3 belum memiliki cleanup orphan object.
- Total quota bucket 5GB belum dihitung real-time.
- Withdrawal belum transfer otomatis ke bank/e-wallet.
- Admin UI belum tersedia.
- KlikQRIS perlu diuji credential sandbox/production valid.
- Telegram polling tidak cocok untuk multi-instance production.
- Google OAuth origin harus terus disinkronkan dengan domain frontend.
- Beberapa data lama mungkin masih memakai local/base64 URL sebelum S3 berjalan penuh.
- UI bahasa dark/light perlu QA manual per route setelah setiap perubahan besar.

## Prioritas Berikutnya

1. Tambahkan test minimal untuk auth, role, project apply/cancel/accept/reject, payment, wallet, review, message, notification, upload, dan Telegram.
2. Audit authorization endpoint payment, wallet, upload, message, dan role `BOTH`.
3. Tambahkan cleanup orphan S3 object.
4. Tambahkan tracking storage usage/quota.
5. Pertimbangkan WebSocket/SSE untuk message/notification realtime.
6. Buat admin dashboard untuk escrow, revenue, withdrawal, payment monitoring, dan dispute.
7. Uji KlikQRIS sandbox/production end-to-end.
8. QA manual seluruh route pada bahasa Indonesia dan English.
9. QA manual seluruh route pada dark dan light mode.
10. Optimasi chunk frontend jika warning Vite perlu diturunkan.

## Checklist Sebelum Demo

- Database local/production hidup.
- `npm run prisma:dev` atau `npm run prisma:migrate` berhasil sesuai environment.
- Seeder hanya dijalankan di database demo/local.
- Backend health check `GET /api/health` OK.
- Frontend `npm run build` berhasil.
- Backend JS syntax check berhasil.
- Prisma schema valid.
- `.env` tidak memakai secret contoh.
- `VITE_API_URL` benar.
- Google OAuth origin benar.
- S3 bucket media CORS benar.
- Telegram mode sesuai environment.
- KlikQRIS credential sesuai mode.
- Domain `https://mediavault.studio/` mengarah ke frontend production.
- Backend production bisa diakses frontend production.
