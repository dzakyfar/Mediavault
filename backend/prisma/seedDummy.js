const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const password = '12345678';

const users = [
  {
    key: 'clientA',
    fullName: 'Rania Putri',
    email: 'rania.client@mediavault.test',
    role: 'CLIENT',
    city: 'Surabaya',
    phone: '081234560001',
  },
  {
    key: 'clientB',
    fullName: 'Bima Prasetyo',
    email: 'bima.client@mediavault.test',
    role: 'CLIENT',
    city: 'Jakarta',
    phone: '081234560002',
  },
  {
    key: 'raka',
    fullName: 'Raka Photo',
    email: 'raka.photo@mediavault.test',
    role: 'FREELANCER',
    city: 'Surabaya',
    phone: '081234560101',
    specialty: 'Wedding | Product Shoot',
    bio: 'Photographer dokumentasi wedding dan produk dengan tone clean, warm, dan editorial.',
    startingPrice: 750000,
    isAvailable: true,
  },
  {
    key: 'maya',
    fullName: 'Maya Visual',
    email: 'maya.visual@mediavault.test',
    role: 'FREELANCER',
    city: 'Bandung',
    phone: '081234560102',
    specialty: 'Corporate | Fashion',
    bio: 'Videographer dan editor untuk brand campaign, company profile, dan fashion lookbook.',
    startingPrice: 1200000,
    isAvailable: true,
  },
  {
    key: 'dion',
    fullName: 'Dion Studio',
    email: 'dion.studio@mediavault.test',
    role: 'FREELANCER',
    city: 'Malang',
    phone: '081234560103',
    specialty: 'Real Estate | Concert',
    bio: 'Tim kecil untuk foto properti, dokumentasi panggung, dan aftermovie event.',
    startingPrice: 950000,
    isAvailable: false,
  },
  {
    key: 'nadia',
    fullName: 'Nadia Hybrid',
    email: 'nadia.hybrid@mediavault.test',
    role: 'BOTH',
    city: 'Yogyakarta',
    phone: '081234560104',
    specialty: 'Photography | Videography',
    bio: 'Hybrid creator yang bisa menerima job kreatif sekaligus memesan jasa untuk campaign kecil.',
    startingPrice: 1000000,
    isAvailable: true,
  },
];

const portfolioByUser = {
  raka: [
    { title: 'Golden Hour Wedding', category: 'wedding', serviceType: 'Wedding Documentation', description: 'Dokumentasi akad dan resepsi outdoor dengan color grading warm.' },
    { title: 'Minimal Product Set', category: 'product', serviceType: 'Product Shoot', description: 'Foto katalog skincare dengan lighting soft dan detail texture.' },
  ],
  maya: [
    { title: 'Corporate Brand Film', category: 'corporate', serviceType: 'Corporate Event', description: 'Video highlight company gathering dan interview leadership.' },
    { title: 'Editorial Fashion Reel', category: 'fashion', serviceType: 'Videography', description: 'Short vertical video untuk launch koleksi fashion lokal.' },
  ],
  dion: [
    { title: 'Apartment Visual Pack', category: 'real-estate', serviceType: 'Real Estate Shoot', description: 'Foto listing apartemen dengan wide angle dan natural light.' },
    { title: 'Concert Aftermovie', category: 'concert', serviceType: 'Photo + Video', description: 'Aftermovie panggung dengan pacing cepat dan crowd moment.' },
  ],
  nadia: [
    { title: 'Cafe Opening Story', category: 'corporate', serviceType: 'Photography', description: 'Dokumentasi opening cafe dan konten sosial media.' },
  ],
};

async function clearDatabase() {
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.projectHistory.deleteMany();
  await prisma.freelancerReview.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.projectApplication.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  await clearDatabase();

  const createdUsers = {};

  for (const user of users) {
    const { key, ...data } = user;
    createdUsers[key] = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
    });
  }

  for (const [key, items] of Object.entries(portfolioByUser)) {
    await prisma.portfolioItem.createMany({
      data: items.map((item) => ({
        ...item,
        freelancerId: createdUsers[key].id,
      })),
    });
  }

  const completedProjects = [
    {
      clientKey: 'clientA',
      freelancerKey: 'raka',
      title: 'Wedding Intimate Surabaya',
      description: 'Dokumentasi wedding intimate dengan 150 tamu.',
      category: 'wedding',
      serviceType: 'Wedding Documentation',
      city: 'Surabaya',
      budget: 3500000,
      rating: 5,
      comment: 'Raka komunikatif, timeline jelas, dan hasil fotonya terasa hangat tanpa berlebihan.',
    },
    {
      clientKey: 'clientB',
      freelancerKey: 'maya',
      title: 'Brand Campaign Lookbook',
      description: 'Video lookbook untuk koleksi fashion lokal.',
      category: 'fashion',
      serviceType: 'Videography',
      city: 'Bandung',
      budget: 4200000,
      rating: 5,
      comment: 'Maya sangat rapi saat revisi. Draft pertama sudah dekat dengan moodboard kami.',
    },
    {
      clientKey: 'clientA',
      freelancerKey: 'dion',
      title: 'Apartment Listing Visual',
      description: 'Foto listing properti untuk marketplace.',
      category: 'real-estate',
      serviceType: 'Real Estate Shoot',
      city: 'Malang',
      budget: 1800000,
      rating: 4,
      comment: 'Hasil properti terang dan clean. Ada sedikit revisi angle, tapi cepat dibereskan.',
    },
    {
      clientKey: 'clientB',
      freelancerKey: 'nadia',
      title: 'Cafe Opening Content',
      description: 'Dokumentasi pembukaan cafe dan konten story.',
      category: 'corporate',
      serviceType: 'Photography',
      city: 'Yogyakarta',
      budget: 2500000,
      rating: 5,
      comment: 'Nadia peka menangkap momen kecil. File final siap dipakai untuk Instagram.',
    },
  ];

  for (const item of completedProjects) {
    const project = await prisma.project.create({
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        serviceType: item.serviceType,
        province: 'Jawa Timur',
        city: item.city,
        district: 'Kota',
        village: 'Pusat',
        postalCode: '60111',
        address: `${item.city}, Indonesia`,
        addressDetail: `Venue dummy ${item.city}`,
        budget: item.budget,
        eventDate: new Date('2026-05-12T09:00:00+07:00'),
        deadline: new Date('2026-05-15T18:00:00+07:00'),
        status: 'COMPLETED',
        progress: 100,
        clientId: createdUsers[item.clientKey].id,
        freelancerId: createdUsers[item.freelancerKey].id,
      },
    });

    await prisma.freelancerReview.create({
      data: {
        projectId: project.id,
        clientId: createdUsers[item.clientKey].id,
        freelancerId: createdUsers[item.freelancerKey].id,
        rating: item.rating,
        comment: item.comment,
      },
    });

    await prisma.projectHistory.create({
      data: {
        projectId: project.id,
        actorId: createdUsers[item.clientKey].id,
        title: 'Project selesai',
        body: `${item.title} selesai dan diulas oleh client.`,
        eventType: 'PROJECT_COMPLETED',
      },
    });
  }

  console.log(`Reset database and seeded ${users.length} demo accounts. Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
