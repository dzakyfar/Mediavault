# MediaVault - Catatan Kondisi Project

Dokumen ini diperbarui berdasarkan kondisi kode saat ini. Catatan lama yang menyebut backend masih mock sudah tidak sesuai, karena backend sekarang sudah menggunakan Express, Prisma, PostgreSQL, JWT auth, dan beberapa endpoint utama sudah terhubung ke frontend.

## Ringkasan Saat Ini

- Frontend menggunakan React + Vite + React Router.
- Backend menggunakan Node.js + Express + Prisma.
- Database menggunakan PostgreSQL.
- Local development memakai Docker Compose untuk PostgreSQL di port host `5433`.
- Autentikasi sudah memakai JWT dan token disimpan di `localStorage`.
- Dashboard client/freelancer sudah mengambil data dari API backend, bukan mock sepenuhnya.
- Theme dark/light sudah ada melalui `ThemeContext` dan light mode sudah disesuaikan ulang secara global lewat `frontend/src/styles/theme.css`.
- CI/CD sudah tersedia di `.github/workflows/ci.yml` dan `.github/workflows/cd.yml`.

## Cara Menjalankan Local

1. Jalankan database:

```bash
docker compose up -d db
```

2. Siapkan backend:

```bash
cd backend
npm install
npm run prisma:dev
npm run seed:dummy
npm run dev
```

3. Siapkan frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend default berjalan di `http://localhost:5000/api`.
Frontend default Vite berjalan di `http://localhost:5173`.

## Environment

Backend `.env.example` saat ini:

```env
DATABASE_URL="postgresql://mediavault:mediavaultpass@localhost:5433/mediavault_dev"
JWT_SECRET="change-this-to-a-long-random-secret"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
PORT=5000
NODE_ENV=production
```

Frontend `.env.example` saat ini:

```env
VITE_API_URL=http://108.136.161.90:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Untuk local development frontend bisa memakai default dari kode:

```env
VITE_API_URL=http://localhost:5000/api
```

## Akun Dummy

Seeder tersedia di `backend/prisma/seedDummy.js`.

Semua password akun dummy:

```text
12345678
```

Seeder saat ini me-reset akun/data demo lama, lalu membuat akun dummy baru beserta portfolio dan review dummy.

Daftar akun:

- `rania.client@mediavault.test` - role CLIENT
- `bima.client@mediavault.test` - role CLIENT
- `raka.photo@mediavault.test` - role FREELANCER
- `maya.visual@mediavault.test` - role FREELANCER
- `dion.studio@mediavault.test` - role FREELANCER, status not available
- `nadia.hybrid@mediavault.test` - role BOTH

## Backend Yang Sudah Ada

Endpoint utama:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/role`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`
- `DELETE /api/auth/me`
- `GET /api/dashboard/client`
- `GET /api/dashboard/freelancer`
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
- `PATCH /api/projects/applications/:applicationId`
- `GET /api/freelancers`
- `GET /api/freelancers/:id`
- `POST /api/freelancers/:id/order`
- `GET /api/portfolio/mine`
- `POST /api/portfolio`
- `PATCH /api/portfolio/:id`
- `DELETE /api/portfolio/:id`
- `GET /api/messages`
- `POST /api/messages`
- `PATCH /api/messages/read`
- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:notificationId/read`
- `POST /api/uploads/presign`
- `GET /api/uploads/download-url`
- `GET /api/health`

Model Prisma yang sudah ada:

- `User`
- `Project`
- `ProjectApplication`
- `PortfolioItem`
- `ProjectFile`
- `FreelancerReview`
- `ProjectSubmission`
- `Invoice`
- `Message`
- `ProjectHistory`
- `Notification`

Alur penting yang sudah ditangani:

- Register/login/me/update role/update profile.
- Login/register dengan Google sudah tersedia lewat Google Identity Services dan endpoint backend `/api/auth/google`.
- Delete akun sudah tersedia dan menghapus data relasi yang memakai cascade.
- Client membuat project/job.
- Client bisa update/delete project selama project masih `DRAFT`, `OPEN`, atau `CANCELLED`.
- Freelancer melihat open job dan apply.
- Client accept/decline application.
- Jika application ditolak, application menjadi `REJECTED`; job tidak lagi tertahan sebagai project aktif freelancer.
- Freelancer yang ditolak bisa melihat job kembali di job request karena filter hanya menyembunyikan application `PENDING` dan `ACCEPTED`.
- Direct order dari halaman profile freelancer membuat project `UNDER_REVIEW`, pesan, notifikasi, dan history.
- Message tersimpan di database dan memiliki status read/unread.
- Message mendukung attachment gambar PNG/JPEG inline dengan batas maksimal 1MB per file.
- Notification menggabungkan notifikasi tersimpan, unread message summary, status project aktif, dan project history.
- Dashboard activity sudah memakai `ProjectHistory`.
- Tracking project tersedia melalui status visual `Open`, `In Progress`, `Under Review`, `Waiting Payment`, dan `Completed`.
- Client dan freelancer dapat melihat timeline/history project.
- Freelancer dapat mengirim draft/bukti pekerjaan setengah jadi beserta komentar untuk direview client.
- Client dapat approve draft atau meminta revisi. Approve memindahkan project ke `WAITING_PAYMENT`; revisi mengembalikan project ke `IN_PROGRESS`.
- Setelah draft disetujui, client dapat memberi rating dan ulasan untuk freelancer. Karena payment masih di-hold, submit review menjadi tahap penutup sementara dan project masuk `COMPLETED`.
- Rating dan review freelancer dihitung dari tabel `FreelancerReview` dan tampil di daftar freelancer/detail profile.
- Upload media baru memakai S3 private via presigned URL. Database menyimpan S3 object key dan metadata file.
- Post job mendukung reference files dengan batas 100MB per file. File dikirim langsung ke S3, lalu bisa diakses ulang melalui presigned download URL.
- Draft/submission project mendukung PNG, JPEG, PDF, MP4, MOV, dan WebM dengan batas 500MB per file melalui S3.
- Freelancer memiliki field `isAvailable` untuk filter available only.
- Portfolio freelancer sudah memiliki CRUD sederhana dan tersimpan di database.

## Frontend Yang Sudah Ada

Halaman public:

- Landing page
- Login
- Register
- Role select
- Explore freelancer
- Freelancer profile
- Pricing masih ada route-nya, tetapi link Pricing sudah dihapus dari footer sesuai request sebelumnya.

Halaman client:

- Dashboard
- Projects
- Project detail
- Find freelancer
- Messages
- Notifications
- Payments
- Payment detail
- Settings
- Post job

Halaman freelancer:

- Dashboard
- Job requests
- My projects
- Project detail
- Portfolio
- Earnings
- Messages
- Notifications
- Settings

Perbaikan frontend yang sudah masuk:

- `MessageCenter` dipakai bersama oleh client dan freelancer.
- Pesan auto-refresh setiap beberapa detik. Ini near-real-time via polling, belum WebSocket.
- `NotificationCenter` dipakai bersama oleh client dan freelancer.
- Notifikasi auto-refresh dan badge notification hanya tampil kalau ada unread count.
- Filter freelancer sudah bekerja berdasarkan search, category/specialty, dan available only.
- Client settings sudah bisa update profile dan delete akun.
- Client settings sudah memiliki push notification toggle lokal dengan toast custom sesuai theme.
- Client settings sudah memiliki change password dengan captcha sederhana tanpa API eksternal.
- Delete account memakai modal frontend custom, bukan popup browser.
- Freelancer settings sudah bisa update profile dan availability.
- Freelancer settings juga memakai modal delete account custom dan change password yang sama.
- Freelancer settings sudah bisa delete akun.
- Portfolio freelancer sudah bisa tambah, edit, dan hapus item dengan pilihan kategori dan jasa terstruktur.
- Hapus portfolio sudah memakai modal frontend custom, bukan `window.confirm`.
- Dashboard freelancer sudah memiliki recent activity seperti dashboard client.
- Dashboard client sudah memiliki rekomendasi freelancer dari database.
- Recent activity client dan freelancer sudah menampilkan tanggal dan jam.
- Sapaan dashboard menyesuaikan jam lokal, bukan hardcoded `Good morning`.
- Detail project client/freelancer sudah menampilkan tracking visual dan riwayat update.
- Detail project client/freelancer sudah memiliki panel Draft Review untuk submit draft, approve, dan request revision.
- Detail project client/freelancer sudah menampilkan reference files yang diupload saat post job.
- Client dapat memberi rating/ulasan freelancer dari detail project saat status `Waiting Payment` atau `Completed`.
- Settings client dan freelancer sudah bisa upload foto profile PNG/JPEG.
- Find freelancer, Explore, Landing, Dashboard client, dan Profile freelancer sudah menampilkan avatar/rating/review count dari database.
- Landing page sudah memakai testimonial dummy bertema MediaVault dengan animasi marquee kanan-ke-kiri.
- Message center sudah bisa mengirim gambar PNG/JPEG maksimal 1MB dan menampilkannya sebagai gambar.
- Upload avatar, portfolio, message image, reference file, dan draft/submission project sudah diarahkan ke S3 untuk upload baru.
- Role select memakai redirect replace jika user sudah punya role.
- Logo MediaVault di dashboard mengarah ke landing page dan tetap mempertahankan session login.
- Navbar/footer landing page sudah dibersihkan dari menu yang diminta dihapus.
- Light/dark mode sudah dipusatkan melalui `ThemeContext`.
- Warna light mode disesuaikan global agar tidak terlalu kontras/sakit di mata.

## CI/CD Dan Deployment

Workflow yang tersedia:

- `.github/workflows/ci.yml`
  - Build frontend pada PR ke `develop`/`main` dan push ke `develop`.
  - Install backend dependencies.
  - Belum ada automated test.

- `.github/workflows/cd.yml`
  - Deploy frontend ke S3 pada push ke `main`.
  - Build frontend memakai secret `PROD_API_URL`.
  - Invalidate CloudFront jika `CLOUDFRONT_DISTRIBUTION_ID` tersedia.
  - Deploy backend ke EC2 via SSH memakai `appleboy/ssh-action`.
  - Backend deploy menjalankan `npm ci`, `prisma generate`, `prisma migrate deploy`, dan restart/start PM2.

Secrets production yang perlu dipastikan ada:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_FRONTEND`
- `PROD_API_URL`
- `CLOUDFRONT_DISTRIBUTION_ID` jika memakai CloudFront
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

## Kecacatan / Risiko Yang Masih Perlu Dikerjakan

- Pesan belum benar-benar realtime berbasis WebSocket/SSE. Saat ini memakai polling 4 detik.
- Notification belum memakai channel realtime. Saat ini memakai polling 6-8 detik.
- Data media lama yang sudah terlanjur tersimpan sebagai base64 di database belum dimigrasikan otomatis ke S3.
- Limit bucket S3 5GB sudah dicatat di frontend/backend, tetapi quota pemakaian bucket belum dihitung otomatis dari S3.
- Presigned download URL bersifat sementara; jika halaman dibuka sangat lama, user perlu refresh untuk mendapat URL baru.
- Payment/invoice/earnings sengaja masih di-hold. Tombol terkait diarahkan sebagai status coming soon/placeholder.
- Tidak ada automated test frontend/backend.
- Backend belum memiliki validasi request yang kuat seperti schema validation.
- Authorization detail masih perlu diperketat untuk beberapa aksi sensitif.
- CORS masih `app.use(cors())`, belum dibatasi origin production.
- `cd.yml` backend mengasumsikan repo ada di `/home/ec2-user/mediavault`; ini perlu disesuaikan jika username/path EC2 berbeda.
- `NODE_ENV=production` di `.env.example` backend kurang cocok untuk local development; untuk local sebaiknya gunakan `development`.
- Beberapa halaman masih punya konten placeholder dari rancangan awal, terutama payments dan earnings.

## Prioritas Berikutnya

1. Tambahkan perhitungan quota S3 dan cleanup orphan object jika user upload tetapi tidak menyimpan form.
2. Ubah pesan/notifikasi dari polling ke WebSocket atau SSE jika ingin benar-benar realtime.
3. Lengkapi invoice/payment/earnings flow sesuai kebutuhan project.
4. Tambahkan test minimal untuk auth, project apply/accept/reject, draft review, freelancer review, message, notification, dan presigned upload.
5. Kunci konfigurasi production: CORS origin, JWT secret kuat, EC2 path, domain/API URL, dan database production.
6. Review UI halaman placeholder payment/earnings supaya seluruh flow terasa konsisten saat fitur finansial mulai dikerjakan.
