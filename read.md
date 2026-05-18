Saya adalah anggota tim pengembang MediaVault. Saat ini kami sudah memiliki:

✅ Frontend React (Vite) sudah selesai dan berhasil dideploy ke AWS S3 (static hosting) via GitHub Actions (CD). Website sudah bisa diakses melalui S3 endpoint (HTTP). Kami berencana menggunakan CloudFront nanti.

✅ GitHub Actions CI/CD sudah berjalan dengan workflow `cd.yml` yang mendeploy frontend ke S3 setiap push ke branch `main`. Workflow `ci.yml` berjalan untuk pull request ke `develop` dan push ke `develop`.

✅ Backend masih berupa mock (tanpa database) dan berjalan di localhost. Kami perlu backend production yang akan dideploy ke EC2, lengkap dengan database PostgreSQL, autentikasi JWT, manajemen proyek, dan integrasi file upload ke S3 (bucket private untuk file user).

Kondisi infrastruktur saat ini:

- EC2 instance (t2.micro, Amazon Linux 2023 atau Ubuntu 22.04) sudah dibuat, tetapi belum dikonfigurasi sama sekali (hanya SSH key saja). IP publik: 108.136.161.90 (contoh). Username: ec2-user atau ubuntu? Saya perlu panduan untuk mengecek dan setup.

- S3 sudah memiliki dua bucket: (1) `mediavault-frontend-xxx` (public read) untuk frontend, (2) `mediavault-userfiles-xxx` (private) untuk file user.

- IAM user `mediavault-deployer` sudah memiliki akses ke kedua bucket dan CloudFront (invalidate). Access key & secret sudah disimpan di GitHub secrets.

- GitHub secrets yang sudah ada: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_FRONTEND. Belum ada secret untuk EC2 dan database.

Tujuan:

1. Membangun backend production (Node.js + Express + Prisma + PostgreSQL) yang akan berjalan di EC2. Backend harus memiliki endpoint untuk:
   - Autentikasi (register, login, JWT)
   - Manajemen proyek (CRUD, status, apply by freelancer)
   - Freelancer profile & portfolio
   - Upload file ke S3 bucket private (menggunakan presigned URL)
   - Notifikasi sederhana (opsional)

2. Mengatur database PostgreSQL di EC2 (bisa diinstall langsung, bukan container) dan menghubungkan backend dengan database.

3. Menyiapkan GitHub Actions workflow untuk deploy backend ke EC2 secara otomatis setiap push ke `main` (dapat menggunakan SSH + PM2 atau Docker). Karena frontend sudah di S3, backend akan di-deploy terpisah.

4. Memperbarui frontend agar mengarah ke API endpoint backend yang sudah live (misal http://<EC2-IP>:5000 atau nanti pakai domain).

5. (Opsional) Menambahkan CloudFront di depan S3 frontend dan backend API (via path-based routing) agar satu domain.
