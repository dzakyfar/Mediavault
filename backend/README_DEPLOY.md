# MediaVault Backend Production Kit

1. Upload/copy folder ini sebagai `backend/` di root repo.
2. Jalankan `scripts/setup-ec2.sh` sekali di EC2.
3. Isi `.env` untuk tes manual, lalu jalankan `npm ci && npx prisma migrate deploy && npm start`.
4. Tambahkan GitHub secrets sesuai panduan chat.
5. Push ke `main`, workflow deploy akan pull, install, migrate, dan restart PM2.
