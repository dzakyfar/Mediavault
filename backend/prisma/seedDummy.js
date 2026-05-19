const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const password = '12345678';

const users = [
  {
    fullName: 'Demo Client Satu',
    email: 'client1@mediavault.test',
    role: 'CLIENT',
    city: 'Surabaya',
  },
  {
    fullName: 'Demo Client Dua',
    email: 'client2@mediavault.test',
    role: 'CLIENT',
    city: 'Jakarta',
  },
  {
    fullName: 'Raka Photo',
    email: 'freelancer1@mediavault.test',
    role: 'FREELANCER',
    city: 'Surabaya',
    specialty: 'Wedding | Product Shoot',
    bio: 'Photographer dokumentasi event dan produk.',
    startingPrice: 750000,
    isAvailable: true,
  },
  {
    fullName: 'Maya Visual',
    email: 'freelancer2@mediavault.test',
    role: 'FREELANCER',
    city: 'Bandung',
    specialty: 'Corporate | Fashion',
    bio: 'Videographer dan editor untuk campaign brand.',
    startingPrice: 1200000,
    isAvailable: true,
  },
  {
    fullName: 'Dion Studio',
    email: 'freelancer3@mediavault.test',
    role: 'FREELANCER',
    city: 'Malang',
    specialty: 'Real Estate | Concert',
    bio: 'Tim kecil untuk foto properti dan dokumentasi panggung.',
    startingPrice: 950000,
    isAvailable: false,
  },
  {
    fullName: 'Nadia Hybrid',
    email: 'both@mediavault.test',
    role: 'BOTH',
    city: 'Yogyakarta',
    specialty: 'Photography | Videography',
    bio: 'Bisa memesan jasa dan menerima job dokumentasi.',
    startingPrice: 1000000,
    isAvailable: true,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        city: user.city,
        specialty: user.specialty,
        bio: user.bio,
        startingPrice: user.startingPrice,
        isAvailable: user.isAvailable ?? true,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  console.log(`Seeded ${users.length} demo accounts. Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
