# MediaVault - Dokumentasi Teknis

Terakhir diperbarui: 7 Juni 2026

Dokumen ini menjelaskan teknologi, arsitektur, struktur folder, fungsi file utama, komponen UI, endpoint, model database, dan alur sistem MediaVault. Tujuannya agar developer baru bisa memahami project tanpa harus membaca semua file satu per satu dari awal.

## Gambaran Umum Sistem

MediaVault adalah aplikasi marketplace freelance multimedia. Ada dua role utama:

- Client: membuat job, memilih freelancer, membayar, memantau progress, memberi review.
- Freelancer: mengelola profil, portfolio, katalog jasa/rate, apply job, mengerjakan project, mengirim draft, menerima saldo.

Role tambahan:

- BOTH: user bisa menjadi client dan freelancer.
- ADMIN: sudah ada di schema untuk kebutuhan backend tertentu, tetapi UI admin belum tersedia.

Sistem berjalan sebagai SPA frontend dan REST API backend.

```text
Browser
  |
  | React + Vite SPA
  v
Frontend routes/pages/components
  |
  | HTTP JSON API + JWT Bearer token
  v
Express Backend
  |
  | Prisma ORM
  v
PostgreSQL

Media upload:
Frontend -> Backend presign -> S3
Frontend -> Backend direct upload -> S3/local fallback

External services:
Google Identity Services
Telegram Bot API
KlikQRIS
AWS S3
```

## Teknologi Yang Digunakan

### Frontend

| Teknologi | Fungsi |
| --- | --- |
| React | Library UI utama untuk membuat komponen dan page. |
| Vite | Dev server dan build tool frontend. |
| TypeScript/TSX | Typing dan struktur komponen frontend. |
| React Router | Routing SPA untuk public page, client dashboard, freelancer dashboard. |
| Tailwind CSS | Utility styling utama. |
| Radix UI/shadcn-style components | Komponen UI dasar seperti dialog, alert, dropdown, select, tabs, dll. |
| lucide-react | Icon set utama. |
| motion | Animasi UI. |
| MUI dependencies | Dependency UI tambahan yang tersedia di project. |
| date-fns | Helper tanggal jika dibutuhkan. |
| localStorage | Menyimpan JWT, theme, dan preferensi bahasa. |

### Backend

| Teknologi | Fungsi |
| --- | --- |
| Node.js | Runtime backend. |
| Express | HTTP server dan routing REST API. |
| Prisma ORM | Query database dan schema management. |
| PostgreSQL | Database utama. |
| JWT/jsonwebtoken | Session aplikasi. |
| bcryptjs | Hash password lokal. |
| google-auth-library | Verifikasi Google credential dari frontend. |
| AWS SDK S3 | Presigned upload/download dan direct upload ke S3. |
| cors | Validasi origin frontend. |
| dotenv | Membaca environment variable. |

### Infrastruktur Dan Integrasi

| Teknologi | Fungsi |
| --- | --- |
| Docker Compose | Menjalankan PostgreSQL local dan opsi container dev. |
| AWS S3 | Penyimpanan file media. |
| CloudFront | Distribusi frontend jika digunakan pada deploy production. |
| EC2 + PM2 | Hosting backend production. |
| GitHub Actions | CI/CD build dan deploy. |
| Telegram Bot API | Notifikasi eksternal. |
| KlikQRIS | Payment gateway QRIS. |

## Arsitektur Backend

Backend memakai pola:

- `server.js`: entrypoint server.
- `src/app.js`: konfigurasi Express, CORS, middleware, route mounting, health check.
- `src/routes`: definisi URL endpoint.
- `src/controllers`: handler bisnis untuk setiap domain.
- `src/services`: logic reusable untuk wallet, notification, Telegram, KlikQRIS.
- `src/utils`: helper umum seperti formatter, upload limit, S3, payment math, token.
- `src/middleware`: auth guard, role guard, error handler.
- `src/jobs`: job background seperti auto-release project dan Telegram polling.
- `prisma/schema.prisma`: model database.
- `prisma/seedDummy.js`: data dummy testing.

### Root Backend Files

| File | Fungsi |
| --- | --- |
| `backend/package.json` | Script backend dan daftar dependencies. |
| `backend/server.js` | Menjalankan Express app pada `PORT`, memulai background job. |
| `backend/Dockerfile` | Image backend untuk container. |
| `backend/.env.example` | Template konfigurasi environment backend. |

### Backend App Dan Config

| File | Fungsi |
| --- | --- |
| `backend/src/app.js` | Membuat Express app, mengatur CORS, JSON limit, static local uploads, mounting semua route, dan `/api/health`. |
| `backend/src/config/prisma.js` | Membuat instance Prisma Client yang dipakai seluruh backend. |

### Backend Middleware

| File | Fungsi |
| --- | --- |
| `backend/src/middleware/authMiddleware.js` | `protect` membaca JWT Bearer token, mengambil user dari database, dan `requireRole` membatasi akses berdasarkan role. |
| `backend/src/middleware/errorMiddleware.js` | Menangani error controller agar response API konsisten. |

### Backend Routes

| File | Base Path | Fungsi |
| --- | --- | --- |
| `backend/src/routes/authRoutes.js` | `/api/auth` | Register, login, Google auth, role, profile, password, delete account, freelancer onboarding. |
| `backend/src/routes/dashboardRoutes.js` | `/api/dashboard` | Dashboard client dan freelancer. |
| `backend/src/routes/projectRoutes.js` | `/api/projects` | CRUD project, apply/cancel/respond application, progress, submission, review. |
| `backend/src/routes/freelancerRoutes.js` | `/api/freelancers` | List freelancer, public profile, order jasa freelancer. |
| `backend/src/routes/messageRoutes.js` | `/api/messages` | List, send, unread count, mark read. |
| `backend/src/routes/notificationRoutes.js` | `/api/notifications` | List notification, mark read, mark all read. |
| `backend/src/routes/portfolioRoutes.js` | `/api/portfolio` | CRUD portfolio item freelancer. |
| `backend/src/routes/offeringRoutes.js` | `/api/offerings` | CRUD katalog jasa/rate freelancer. |
| `backend/src/routes/uploadRoutes.js` | `/api/uploads` | Presign upload, direct upload, signed download URL. |
| `backend/src/routes/paymentRoutes.js` | `/api/payments` | QRIS create/status/webhook, wallet payment, payment detail/list. |
| `backend/src/routes/walletRoutes.js` | `/api/wallet` | Wallet summary, withdrawal, escrow overview admin. |
| `backend/src/routes/telegramRoutes.js` | `/api/telegram` | Telegram connect, sync, settings, disconnect, webhook. |

### Backend Controllers

| File | Fungsi Utama |
| --- | --- |
| `backend/src/controllers/authController.js` | Register/login email password, Google login, role update, profile update, change password, delete account, register freelancer. |
| `backend/src/controllers/dashboardController.js` | Menyusun data dashboard client/freelancer, statistik, activity, recommended freelancer. Statistik terbaru dihitung lewat query database terpisah agar tidak bergantung 5 item terbaru. |
| `backend/src/controllers/projectController.js` | Semua alur project: list/create/update/delete, open jobs, detail, progress, submission, revision/approve, review, apply, cancel apply, accept/reject application, freelancer confirm/reject paid project. |
| `backend/src/controllers/freelancerController.js` | List freelancer, public profile freelancer, order jasa dari profile freelancer. |
| `backend/src/controllers/messageController.js` | Conversation list, send message, unread count, mark read. Juga memblokir pesan baru ke freelancer busy kecuali ada project aktif dengan pengirim. |
| `backend/src/controllers/notificationController.js` | List notification dan read state. Menggabungkan notification project/payment/message sesuai user. |
| `backend/src/controllers/portfolioController.js` | CRUD portfolio item dan multi media portfolio. |
| `backend/src/controllers/offeringController.js` | CRUD offering/katalog jasa freelancer. Delete menonaktifkan offering, bukan hard delete. |
| `backend/src/controllers/uploadController.js` | Membuat presigned upload URL, direct upload, dan signed download URL. |
| `backend/src/controllers/paymentController.js` | Create QRIS, pay with wallet, payment status, webhook KlikQRIS, payment list/detail, settlement project. |
| `backend/src/controllers/walletController.js` | Wallet summary, withdrawal request, escrow overview. |
| `backend/src/controllers/telegramController.js` | Status Telegram, connect token, sync pending updates, settings, disconnect, webhook endpoint. |

### Backend Services

| File | Fungsi |
| --- | --- |
| `backend/src/services/walletService.js` | Membuat wallet jika belum ada, credit/debit saldo, membuat wallet transaction, format wallet summary. |
| `backend/src/services/notificationService.js` | Membuat notification database dan mengirim Telegram jika user mengaktifkan. |
| `backend/src/services/telegramService.js` | Wrapper Telegram Bot API, membuat dashboard URL, cek konfigurasi bot. |
| `backend/src/services/telegramConnectService.js` | Memproses command `/start <token>` dan menghubungkan chat Telegram ke user. |
| `backend/src/services/telegramUpdateService.js` | Mengambil update Telegram untuk polling/manual sync dan meneruskan ke connect service. |
| `backend/src/services/klikqrisService.js` | Membuat request ke KlikQRIS create/status, mendukung mode sandbox/production. |

### Backend Jobs

| File | Fungsi |
| --- | --- |
| `backend/src/jobs/autoReleaseJob.js` | Mengecek project delivered yang melewati `autoReleaseAt`, lalu menyelesaikan settlement otomatis. |
| `backend/src/jobs/telegramPollingJob.js` | Menjalankan Telegram polling jika `TELEGRAM_BOT_MODE=polling`. Cocok untuk local/HTTP. |

### Backend Utils

| File | Fungsi |
| --- | --- |
| `backend/src/utils/formatters.js` | Format currency, date, project serialization, short name, payment/project response helper. |
| `backend/src/utils/generateToken.js` | Membuat JWT token. |
| `backend/src/utils/mediaUrls.js` | Resolve media key menjadi URL yang bisa dipakai frontend. |
| `backend/src/utils/paymentMath.js` | Perhitungan fee/payment seperti admin fee dan settlement math. |
| `backend/src/utils/s3Storage.js` | Konfigurasi S3, local fallback root, upload/download object helper. |
| `backend/src/utils/uploadLimits.js` | Validasi ukuran dan tipe file upload untuk avatar, message image, portfolio, reference, submission. |

### Backend Prisma

| File/Folder | Fungsi |
| --- | --- |
| `backend/prisma/schema.prisma` | Definisi model database, relation, enum, index. |
| `backend/prisma/seedDummy.js` | Reset database demo dan membuat akun/data dummy. |
| `backend/prisma/migrations/*/migration.sql` | Riwayat perubahan schema database. |

## Arsitektur Frontend

Frontend memakai React SPA:

- `main.tsx` mount React app.
- `App.tsx` membungkus app dengan provider.
- `routes.tsx` mendefinisikan route public/client/freelancer.
- `context` menyimpan auth, theme, language.
- `pages` berisi halaman route.
- `components` berisi komponen reusable.
- `lib` berisi helper API, upload, catalog, Google auth, region.
- `styles` berisi CSS global, theme, font, Tailwind.

### Root Frontend Files

| File | Fungsi |
| --- | --- |
| `frontend/package.json` | Script frontend dan dependencies. |
| `frontend/vite.config.ts` | Konfigurasi Vite dan Tailwind plugin. |
| `frontend/index.html` | HTML shell dan favicon/title. |
| `frontend/Dockerfile.dev` | Container dev frontend. |
| `frontend/postcss.config.mjs` | Konfigurasi PostCSS. |
| `frontend/default_shadcn_theme.css` | Referensi theme shadcn/default styling. |
| `frontend/public/favicon.svg` | Favicon lightning MediaVault. |

### Frontend Entry Dan Routing

| File | Fungsi |
| --- | --- |
| `frontend/src/main.tsx` | Mount React ke DOM. |
| `frontend/src/app/App.tsx` | Root app, provider auth/theme/language/router. |
| `frontend/src/app/routes.tsx` | Semua route public, client, freelancer, protected route. |

### Frontend Context

| File | Fungsi |
| --- | --- |
| `frontend/src/app/context/AuthContext.tsx` | Menyimpan user login, token, login/register/google/role/profile/delete account/register freelancer. |
| `frontend/src/app/context/ThemeContext.tsx` | Menyimpan dark/light theme dan update class/theme global. |
| `frontend/src/app/context/LanguageContext.tsx` | Menyimpan bahasa aktif, helper `t(id, en)`, update `documentElement.lang`. |

### Frontend Lib

| File | Fungsi |
| --- | --- |
| `frontend/src/app/lib/api.ts` | Helper `apiRequest`, token localStorage, base URL API, dashboard path by role. |
| `frontend/src/app/lib/googleAuth.ts` | Load Google Identity Services dan request credential. |
| `frontend/src/app/lib/indonesiaRegions.ts` | Helper region Indonesia, geocoding, reverse geocoding, current position. |
| `frontend/src/app/lib/locationOptions.ts` | Data/helper lokasi jika dipakai UI. |
| `frontend/src/app/lib/s3Upload.ts` | Upload file ke S3 presign atau backend direct fallback. |
| `frontend/src/app/lib/serviceCatalog.ts` | Kategori dan jasa multimedia yang dipakai post job/portfolio/offering. |
| `frontend/src/app/lib/uploadLimits.ts` | Limit upload frontend dan validator file. |

### Frontend Public Pages

| File | Route | Fungsi |
| --- | --- | --- |
| `LandingPage.tsx` | `/` | Landing page, hero, catalog, voices/testimonial marquee, footer/contact/CS. |
| `LoginPage.tsx` | `/login` | Login email/password dan Google sign-in. |
| `RegisterPage.tsx` | `/register` | Register user, Terms/Privacy modal, Google signup. |
| `RoleSelectPage.tsx` | `/role-select` | Pilih role client/freelancer/both dan Telegram intro. |
| `ExplorePage.tsx` | `/explore` | Public explore freelancer. |
| `AboutUsPage.tsx` | `/about` | Profil perusahaan MediaVault. |
| `SuccessStoriesPage.tsx` | `/success-stories` | Cerita sukses freelancer. |
| `FreelancerProfilePage.tsx` | `/freelancer/:id` | Public profile freelancer, pricelist, order jasa, portfolio modal, review. |
| `FreelancerOnboardingPage.tsx` | `/freelancer-onboarding` | Form kelengkapan freelancer, alamat, portfolio awal, agreement. |
| `PostJobPage.tsx` | `/post-job` | Form client membuat job, alamat, map, reference files. |
| `NotFoundPage.tsx` | `*` | Halaman 404. |

### Frontend Client Pages

| File | Route | Fungsi |
| --- | --- | --- |
| `client/DashboardPage.tsx` | `/dashboard/client` | Summary client, project aktif, recommended freelancer, activity. |
| `client/ProjectsPage.tsx` | `/dashboard/client/projects` | List project client dan delete project. |
| `client/ProjectDetailPage.tsx` | `/dashboard/client/projects/:id` | Detail project, application review, payment, submission review, freelancer review. |
| `client/FindFreelancerPage.tsx` | `/dashboard/client/find-freelancer` | Search/filter freelancer untuk client. |
| `client/MessagesPage.tsx` | `/dashboard/client/messages` | Wrapper dashboard untuk `MessageCenter`. |
| `client/NotificationsPage.tsx` | `/dashboard/client/notifications` | Wrapper dashboard untuk `NotificationCenter`. |
| `client/PaymentsPage.tsx` | `/dashboard/client/payments` | Wallet client, withdrawal, list payment. |
| `client/PaymentDetailPage.tsx` | `/dashboard/client/payments/:id` | Detail payment, timeline, submission approve/revision. |
| `client/SettingsPage.tsx` | `/dashboard/client/settings` | Profile, avatar, address, language, password, Telegram, delete account. |

### Frontend Freelancer Pages

| File | Route | Fungsi |
| --- | --- | --- |
| `freelancer/DashboardPage.tsx` | `/dashboard/freelancer` | Summary freelancer, active projects, job request, rating, completed projects, activity. |
| `freelancer/JobRequestsPage.tsx` | `/dashboard/freelancer/requests` | List open jobs, apply job, cancel application. |
| `freelancer/ProjectsPage.tsx` | `/dashboard/freelancer/projects` | List project freelancer, confirm/reject paid order. |
| `freelancer/ProjectDetailPage.tsx` | `/dashboard/freelancer/projects/:id` | Detail project freelancer, tracker, submission panel. |
| `freelancer/PortfolioPage.tsx` | `/dashboard/freelancer/portfolio` | CRUD portfolio item dan CRUD offering/katalog jasa. |
| `freelancer/EarningsPage.tsx` | `/dashboard/freelancer/earnings` | Wallet freelancer, mutation, withdrawal. |
| `freelancer/MessagesPage.tsx` | `/dashboard/freelancer/messages` | Wrapper dashboard untuk `MessageCenter`. |
| `freelancer/NotificationsPage.tsx` | `/dashboard/freelancer/notifications` | Wrapper dashboard untuk `NotificationCenter`. |
| `freelancer/SettingsPage.tsx` | `/dashboard/freelancer/settings` | Profile, availability, avatar, address, language, password, Telegram, delete account. |

### Frontend Shared Components

| File | Fungsi |
| --- | --- |
| `DashboardLayout.tsx` | Layout dashboard, header greeting, theme toggle, notification/message counters, sidebar. |
| `DashboardSidebar.tsx` | Sidebar client/freelancer, menu, badge unread, switch role, logout. |
| `Navbar.tsx` | Navbar public page. |
| `Footer.tsx` | Footer, contact popup, community WhatsApp, social link. |
| `EmptyState.tsx` | Komponen empty/loading state. |
| `UserAvatar.tsx` | Avatar dengan image atau inisial. |
| `GoogleSignInButton.tsx` | Tombol Google sign-in/signup. |
| `GoogleSignupConsentModal.tsx` | Modal Terms/Privacy + password/phone untuk Google user baru. |
| `components/auth/RequireAuth.tsx` | Guard route berdasarkan login, role, dan kelengkapan onboarding freelancer. |
| `components/figma/ImageWithFallback.tsx` | Image fallback helper. |

### Frontend Dashboard Components

| File | Fungsi |
| --- | --- |
| `ChangePasswordCard.tsx` | Form ubah password dengan captcha sederhana. |
| `ConfirmDialog.tsx` | Modal konfirmasi frontend custom. |
| `DraggableLocationMap.tsx` | Map draggable untuk memilih koordinat. |
| `LanguagePreferenceCard.tsx` | Pengaturan bahasa user. |
| `MessageCenter.tsx` | UI chat shared, image upload inline, read message. |
| `NotificationCenter.tsx` | UI notification shared, filter, mark read/all read. |
| `PhoneInput.tsx` | Input nomor telepon. |
| `ProjectReviewPanel.tsx` | Submission/draft upload dan review panel project. |
| `ProjectTracker.tsx` | Visual tracker/progress project. |
| `SearchableRegionSelect.tsx` | Select wilayah searchable dengan dukungan bahasa. |
| `SmoothToast.tsx` | Toast frontend sederhana. |
| `TelegramNotificationCard.tsx` | Connect/sync/enable/disable/disconnect Telegram. |

### Frontend UI Components

Folder `frontend/src/app/components/ui` berisi komponen UI generik berbasis Radix/shadcn-style seperti:

- Accordion
- Alert
- Alert dialog
- Avatar
- Badge
- Breadcrumb
- Button
- Calendar
- Card
- Carousel
- Checkbox
- Collapsible
- Command
- Context menu
- Dialog
- Drawer
- Dropdown menu
- Form
- Hover card
- Input
- Input OTP
- Label
- Menubar
- Navigation menu
- Pagination
- Popover
- Progress
- Radio group
- Resizable
- Scroll area
- Select
- Separator
- Sheet
- Sidebar
- Skeleton
- Slider
- Sonner
- Switch
- Table
- Tabs
- Textarea
- Toast/toggle/tooltip utilities

Komponen ini adalah building block UI. Tidak semua dipakai secara aktif di page utama, tetapi tersedia sebagai library komponen project.

### Frontend Styles

| File | Fungsi |
| --- | --- |
| `styles/globals.css` | Styling global utama. |
| `styles/theme.css` | Variable theme dark/light dan visual direction. |
| `styles/tailwind.css` | Tailwind entry. |
| `styles/index.css` | Entry CSS. |
| `styles/fonts.css` | Font import dan font styling. |

## Model Database Dan Relasi

### User

Menyimpan akun user:

- Auth: email, passwordHash, googleId.
- Role: CLIENT, FREELANCER, BOTH, ADMIN.
- Profile: fullName, avatarUrl, phone, bio, specialty, startingPrice.
- Freelancer availability: isAvailable.
- Address: province, city, district, village, postalCode, addressDetail, latitude, longitude, locationSource.
- Telegram: chatId, username, notify setting, connect token.
- Relasi: client projects, freelancer jobs, applications, portfolio, messages, notifications, offerings, wallet, withdrawals.

### Project

Menyimpan job/project:

- Brief: title, description, category, serviceType.
- Location: wilayah, address, coordinates.
- Financial: budget.
- Schedule: eventDate, deadline.
- Workflow: status, progress, deliveredAt, autoReleaseAt, completedAt.
- Relation: client, freelancer, applications, files, invoices, payments, histories, submissions, reviews.

### Offering

Katalog jasa freelancer:

- title, serviceType, price.
- ratePerHour, ratePerPhoto, extraPersonFee.
- estimatedHours, capacityPersons.
- description, benefits, toolsSpec, relatedSpecs.
- isActive untuk soft delete.

### ProjectApplication

Request/apply freelancer ke project:

- projectId, freelancerId.
- message, serviceType.
- status PENDING/ACCEPTED/REJECTED.
- Unique per projectId + freelancerId.

### PortfolioItem Dan PortfolioMedia

PortfolioItem adalah judul/kategori/deskripsi portfolio.

PortfolioMedia menyimpan banyak media per portfolio item:

- maksimal 5 image.
- maksimal 1 video.
- sortOrder untuk urutan media.

### ProjectFile

Reference file dari client untuk project.

### ProjectSubmission

Draft/progress/final submission freelancer:

- comment wajib.
- file metadata.
- status PENDING/APPROVED/REVISION_REQUESTED.
- reviewComment dan reviewedAt.

### FreelancerReview

Rating dan ulasan client kepada freelancer setelah project selesai.

### Payment Dan Invoice

Payment menyimpan transaksi KlikQRIS:

- klikqrisOrderId.
- amountRequest, amountPaid, baseAmount, adminFeeClient, totalAmount.
- qrisUrl, directUrl, signature.
- status PENDING/PAID/EXPIRED/FAILED.

Invoice menyimpan tagihan project internal.

### Wallet, WalletTransaction, Withdrawal

Wallet menyimpan saldo user.

WalletTransaction menyimpan mutasi credit/debit.

Withdrawal menyimpan request penarikan saldo.

### PlatformRevenue

Mencatat pendapatan platform dari admin fee client/freelancer.

### Message

Chat antar user:

- senderId, receiverId, body.
- optional imageUrl/image metadata.
- readAt.

### Notification

Notifikasi database:

- userId, type, title, body, readAt.

### ProjectHistory

Riwayat aktivitas project yang dipakai untuk recent activity dan audit workflow.

## Alur Sistem Detail

### Register/Login

1. User register/login dari frontend.
2. Frontend mengirim request ke `/api/auth`.
3. Backend memvalidasi user/password atau Google credential.
4. Backend membuat JWT.
5. Frontend menyimpan token di localStorage.
6. `AuthContext` mengambil `/api/auth/me`.
7. Route guard mengarahkan user sesuai role.

### Role Select

1. User baru login tetapi belum punya role.
2. User diarahkan ke `/role-select`.
3. Frontend update role via `PATCH /api/auth/role`.
4. Jika freelancer, user diarahkan ke onboarding.
5. Jika client, user diarahkan ke dashboard client.

### Freelancer Onboarding

1. User mengisi data freelancer.
2. User memilih kategori keahlian.
3. User mengisi alamat dan koordinat.
4. User dapat upload portfolio awal.
5. Backend menyimpan profile, availability default true, portfolio awal jika ada.
6. User masuk dashboard freelancer.

### Post Job

1. Client mengisi form post job.
2. Region/alamat/map menghasilkan alamat lengkap dan koordinat.
3. Reference file diupload lebih dulu ke S3/fallback.
4. Frontend membuat project via `POST /api/projects`.
5. Backend menyimpan project, files, history, notification.

### Apply/Accept/Reject

1. Freelancer melihat open job via `/api/projects/open`.
2. Freelancer apply via `/api/projects/:projectId/apply`.
3. Client melihat pending application di project detail.
4. Client accept/reject via `/api/projects/applications/:applicationId`.
5. Accept memasang freelancerId dan menyiapkan flow payment.
6. Reject membuat application status REJECTED.
7. Apply ulang setelah rejected diperbolehkan dengan mengaktifkan kembali application.

### Order Dari Public Profile

1. Client membuka `/freelancer/:id`.
2. Client memilih offering/pricelist.
3. Form order otomatis mengikuti offering.
4. Sistem menghitung service fee, extra person fee, transport, admin fee.
5. Client submit order.
6. Backend membuat project order via `/api/freelancers/:id/order`.
7. Client membuat payment QRIS/wallet.

### Payment Dan Settlement

1. Client create payment.
2. KlikQRIS mengembalikan QRIS/direct URL.
3. Payment status dicek manual atau via webhook.
4. Jika paid, project masuk alur freelancer confirmation.
5. Freelancer confirm untuk mulai.
6. Freelancer submit hasil.
7. Client approve.
8. Backend settlement meng-credit wallet freelancer, mencatat platform revenue, dan menyelesaikan project.

### Submission Review

1. Freelancer mengirim submission dengan komentar dan file.
2. Project masuk DELIVERED.
3. Client approve atau request revision.
4. Approve menyelesaikan settlement.
5. Revision mengembalikan project ke IN_PROGRESS.
6. Auto-release menyelesaikan project jika client tidak merespons setelah batas waktu.

### Message

1. Message center mengambil conversation dari `/api/messages`.
2. User mengirim body dan optional image.
3. Backend menyimpan message.
4. Backend membuat notification type MESSAGE.
5. Telegram dikirim tanpa isi chat lengkap.
6. Mark read memperbarui message dan notification read state.
7. Freelancer busy tidak bisa menerima pesan baru kecuali ada project aktif dengan pengirim.

### Notification

1. Backend event membuat notification database.
2. Dashboard layout polling unread count.
3. Notification center bisa mark single/all read.
4. Jika Telegram aktif, notification penting dikirim ke Telegram.

### Upload

1. Frontend validasi tipe/ukuran file.
2. Frontend meminta presigned URL ke backend.
3. Frontend PUT file ke S3.
4. Jika gagal dan ukuran memungkinkan, frontend fallback ke backend direct upload.
5. Backend direct upload menyimpan ke S3 atau local fallback.
6. Database menyimpan key/metadata file.

## Endpoint Ringkas

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/role`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`
- `DELETE /api/auth/me`
- `POST /api/auth/register-freelancer`

### Dashboard

- `GET /api/dashboard/client`
- `GET /api/dashboard/freelancer`

### Projects

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

### Other Domains

- Freelancers: `/api/freelancers`
- Messages: `/api/messages`
- Notifications: `/api/notifications`
- Portfolio: `/api/portfolio`
- Offerings: `/api/offerings`
- Uploads: `/api/uploads`
- Payments: `/api/payments`
- Wallet: `/api/wallet`
- Telegram: `/api/telegram`
- Health: `/api/health`

## Elemen UI Penting

### Landing Page

Elemen:

- Navbar.
- Hero CTA.
- Service catalog.
- Steps/benefit section.
- Voices From The Vault marquee.
- Success/About/Footer links.
- Contact popup.
- Floating customer service button.

Fungsi:

- Mengenalkan platform.
- Mengarahkan user ke register/login/explore/about/success stories.
- Menghubungkan user ke contact email atau WhatsApp community.

### Dashboard Layout

Elemen:

- Sidebar.
- Header greeting.
- Date.
- Theme toggle.
- Notification bell with count.
- User avatar.

Fungsi:

- Menjadi kerangka semua dashboard.
- Menampilkan unread message/notification.
- Menjaga navigasi client/freelancer konsisten.

### Message Center

Elemen:

- Conversation list.
- Chat body.
- Text input.
- Image upload.
- Inline image preview.

Fungsi:

- Komunikasi user.
- Read/unread tracking.
- Notifikasi message.

### Notification Center

Elemen:

- Filter notification.
- Notification cards.
- Mark read.
- Mark all read.

Fungsi:

- Menampilkan event project/payment/message/info.
- Sinkronisasi unread state.

### Project Tracker

Elemen:

- Progress bar/stages.
- Status label.
- Update progress action.

Fungsi:

- Visualisasi tahap project.
- Membantu client/freelancer memahami posisi pekerjaan.

### Project Review Panel

Elemen:

- Submission comment.
- File upload.
- Submission history.
- Approve/revision controls untuk client.

Fungsi:

- Mengirim bukti/draft hasil.
- Menjaga review/revision tercatat.

### Portfolio Page

Elemen:

- Form portfolio.
- Multi-image/video upload.
- Portfolio card.
- Offering/katalog jasa form.
- Active offering list.

Fungsi:

- Freelancer mengelola karya dan pricelist jasa.
- Public profile client membaca data ini.

### Public Freelancer Profile

Elemen:

- Header profile.
- Availability badge.
- Address/location.
- Tag jasa.
- Pricelist/offering cards.
- Portfolio section.
- Reviews.
- Order form.

Fungsi:

- Client menilai freelancer.
- Client memilih pricelist.
- Client memesan jasa.
- Client menghubungi freelancer jika tersedia.

## Batasan Upload

| Scope | Tipe | Limit |
| --- | --- | --- |
| Avatar | PNG/JPEG | 1MB |
| Message image | PNG/JPEG | 1MB |
| Portfolio image | PNG/JPEG | 1MB per gambar |
| Portfolio video | MP4/MOV/WebM | 100MB per video |
| Project reference | Multiple supported files | 100MB per file |
| Project submission | PNG/JPEG/PDF/Video | 500MB per file |

Portfolio item:

- Maksimal 5 gambar.
- Maksimal 1 video.

## Validasi Dan Testing Yang Tersedia

Saat ini belum ada unit test/e2e test.

Validasi manual/otomatis yang bisa dijalankan:

```bash
cd frontend
npm run build
```

```bash
cd backend
npx prisma validate
```

```bash
node --check backend/src/**/*.js
```

Perlu ditambahkan:

- Unit test auth.
- Integration test project workflow.
- Integration test upload.
- Integration test payment/wallet.
- Integration test Telegram.
- E2E test role/client/freelancer flow.

## Catatan Maintenance

- Jangan commit `.env`, `node_modules`, `dist`, file upload local, atau secret.
- Jangan jalankan `seed:dummy` pada database production.
- Jika menambah endpoint, tambahkan route, controller, validasi role, dan update dokumentasi.
- Jika menambah page frontend, update `routes.tsx`, sidebar/nav jika diperlukan, dan dokumentasi.
- Jika menambah model Prisma, buat migration dan update seed/test data.
- Jika mengubah upload limit, update backend `uploadLimits.js`, frontend `uploadLimits.ts`, dan dokumentasi.
- Jika mengubah alur payment, audit settlement wallet dan platform revenue.
- Jika mengubah notification, cek database notification dan Telegram body agar tidak membocorkan data sensitif.
- Jika deploy HTTPS, Telegram production sebaiknya memakai webhook.
- Jika deploy masih HTTP/local, Telegram memakai polling.

## Known Risks

- Realtime message/notification masih polling/event refresh, belum WebSocket/SSE.
- No automated test runner.
- S3 orphan cleanup belum ada.
- Storage quota 5GB belum dihitung realtime.
- Withdrawal belum transfer otomatis.
- Admin dashboard belum tersedia.
- KlikQRIS perlu diuji penuh dengan credential valid.
- Telegram polling tidak cocok untuk multi-instance production.
- Beberapa dependency UI tersedia tetapi tidak semua aktif dipakai.
- File migration lama tetap dipertahankan sebagai histori schema.

