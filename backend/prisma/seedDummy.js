const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const password = '12345678';

const users = [
  {
    key: 'clientA',
    fullName: 'Rania Putri',
    email: 'rania.client@mediavault.test',
    role: 'CLIENT',
    phone: '081234560001',
    province: 'Jawa Timur',
    city: 'Surabaya',
    district: 'Rungkut',
    village: 'Medokan Ayu',
    postalCode: '60295',
    addressDetail: 'Jl. Medokan Asri No. 18',
    latitude: -7.3261,
    longitude: 112.7786,
    locationSource: 'seed',
  },
  {
    key: 'clientB',
    fullName: 'Bima Prasetyo',
    email: 'bima.client@mediavault.test',
    role: 'CLIENT',
    phone: '081234560002',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    district: 'Kebayoran Baru',
    village: 'Melawai',
    postalCode: '12160',
    addressDetail: 'Jl. Panglima Polim No. 7',
    latitude: -6.2445,
    longitude: 106.7991,
    locationSource: 'seed',
  },
  {
    key: 'raka',
    fullName: 'Raka Photo',
    email: 'raka.photo@mediavault.test',
    role: 'FREELANCER',
    phone: '081234560101',
    province: 'Jawa Timur',
    city: 'Surabaya',
    district: 'Wonokromo',
    village: 'Darmo',
    postalCode: '60241',
    addressDetail: 'Studio Raka, Jl. Darmo Permai No. 12',
    latitude: -7.2918,
    longitude: 112.7397,
    locationSource: 'seed',
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
    phone: '081234560102',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    village: 'Dago',
    postalCode: '40135',
    addressDetail: 'Maya Creative Space, Jl. Ir. H. Juanda No. 88',
    latitude: -6.8839,
    longitude: 107.6139,
    locationSource: 'seed',
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
    phone: '081234560103',
    province: 'Jawa Timur',
    city: 'Malang',
    district: 'Klojen',
    village: 'Oro-oro Dowo',
    postalCode: '65119',
    addressDetail: 'Jl. Ijen Boulevard No. 21',
    latitude: -7.9732,
    longitude: 112.6208,
    locationSource: 'seed',
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
    phone: '081234560104',
    province: 'DI Yogyakarta',
    city: 'Yogyakarta',
    district: 'Gondokusuman',
    village: 'Cokrodiningratan',
    postalCode: '55233',
    addressDetail: 'Jl. Cik Di Tiro No. 15',
    latitude: -7.7828,
    longitude: 110.3731,
    locationSource: 'seed',
    specialty: 'Photography | Videography',
    bio: 'Hybrid creator yang bisa menerima job kreatif sekaligus memesan jasa untuk campaign kecil.',
    startingPrice: 1000000,
    isAvailable: true,
  },
];

const portfolioByUser = {
  raka: [
    {
      title: 'Golden Hour Wedding',
      category: 'wedding',
      serviceType: 'Wedding Photography',
      description: 'Dokumentasi akad dan resepsi outdoor dengan color grading warm.',
      media: ['/catalog/wedding.jpg', '/catalog/product.jpg'],
    },
    {
      title: 'Minimal Product Set',
      category: 'product',
      serviceType: 'Product Shoot',
      description: 'Foto katalog produk skincare dengan lighting soft dan detail texture.',
      media: ['/catalog/product.jpg'],
    },
  ],
  maya: [
    {
      title: 'Corporate Brand Film',
      category: 'corporate',
      serviceType: 'Corporate Video',
      description: 'Video highlight company gathering dan interview leadership.',
      media: ['/catalog/corporate.jpg', '/catalog/fashion.jpg'],
    },
    {
      title: 'Editorial Fashion Reel',
      category: 'fashion',
      serviceType: 'Fashion Reel',
      description: 'Short vertical video untuk launch koleksi fashion lokal.',
      media: ['/catalog/fashion.jpg'],
    },
  ],
  dion: [
    {
      title: 'Apartment Visual Pack',
      category: 'real-estate',
      serviceType: 'Real Estate Shoot',
      description: 'Foto listing apartemen dengan wide angle dan natural light.',
      media: ['/catalog/real-estate.jpg'],
    },
    {
      title: 'Concert Aftermovie',
      category: 'concert',
      serviceType: 'Concert Aftermovie',
      description: 'Aftermovie panggung dengan pacing cepat dan crowd moment.',
      media: ['/catalog/concert.jpg', '/catalog/corporate.jpg'],
    },
  ],
  nadia: [
    {
      title: 'Cafe Opening Story',
      category: 'corporate',
      serviceType: 'Social Media Content',
      description: 'Dokumentasi pembukaan cafe dan konten story untuk social media.',
      media: ['/catalog/corporate.jpg'],
    },
  ],
};

const offeringsByUser = {
  raka: [
    {
      title: 'Wedding Essential',
      serviceType: 'Wedding Photography',
      price: 750000,
      ratePerHour: 250000,
      ratePerPhoto: 35000,
      extraPersonFee: 150000,
      estimatedHours: 6,
      capacityPersons: 2,
      benefits: ['1 photographer utama', '80 edited photos', 'Online gallery 14 hari'],
      toolsSpec: 'Sony A7 IV, 35mm, 85mm, Godox lighting',
      relatedSpecs: ['Wedding', 'Indoor', 'Outdoor'],
    },
    {
      title: 'Product Clean Catalog',
      serviceType: 'Product Shoot',
      price: 500000,
      ratePerHour: 200000,
      ratePerPhoto: 25000,
      extraPersonFee: 100000,
      estimatedHours: 3,
      capacityPersons: 1,
      benefits: ['10 edited photos', 'White/background set', 'Basic retouch'],
      toolsSpec: 'Studio mini, macro lens, continuous light',
      relatedSpecs: ['Product', 'Catalog', 'Brand'],
    },
  ],
  maya: [
    {
      title: 'Corporate Highlight',
      serviceType: 'Corporate Video',
      price: 1200000,
      ratePerHour: 350000,
      ratePerPhoto: 0,
      extraPersonFee: 200000,
      estimatedHours: 8,
      capacityPersons: 3,
      benefits: ['1 video highlight 60 detik', 'Interview cutaway', 'Color grading'],
      toolsSpec: 'Sony FX3, DJI RS, wireless mic',
      relatedSpecs: ['Corporate', 'Event', 'Interview'],
    },
    {
      title: 'Fashion Reel Pack',
      serviceType: 'Fashion Reel',
      price: 900000,
      ratePerHour: 300000,
      ratePerPhoto: 0,
      extraPersonFee: 150000,
      estimatedHours: 5,
      capacityPersons: 2,
      benefits: ['3 vertical reels', 'Music sync', 'Basic motion text'],
      toolsSpec: 'Mirrorless 4K, gimbal, LED tube',
      relatedSpecs: ['Fashion', 'Reels', 'Campaign'],
    },
  ],
  dion: [
    {
      title: 'Property Listing Pack',
      serviceType: 'Real Estate Shoot',
      price: 950000,
      ratePerHour: 275000,
      ratePerPhoto: 30000,
      extraPersonFee: 125000,
      estimatedHours: 4,
      capacityPersons: 2,
      benefits: ['25 edited property photos', 'Wide angle coverage', 'Same week delivery'],
      toolsSpec: 'Wide lens, tripod, flash bounce',
      relatedSpecs: ['Real Estate', 'Interior', 'Listing'],
    },
    {
      title: 'Concert Aftermovie Lite',
      serviceType: 'Concert Aftermovie',
      price: 1500000,
      ratePerHour: 400000,
      ratePerPhoto: 0,
      extraPersonFee: 250000,
      estimatedHours: 6,
      capacityPersons: 3,
      benefits: ['1 aftermovie 90 detik', 'Crowd moments', 'Audio sync'],
      toolsSpec: 'Dual camera, gimbal, on-camera light',
      relatedSpecs: ['Concert', 'Event', 'Aftermovie'],
    },
  ],
  nadia: [
    {
      title: 'Social Launch Kit',
      serviceType: 'Social Media Content',
      price: 1000000,
      ratePerHour: 280000,
      ratePerPhoto: 25000,
      extraPersonFee: 150000,
      estimatedHours: 5,
      capacityPersons: 2,
      benefits: ['20 edited photos', '2 short reels', 'Caption direction'],
      toolsSpec: 'Hybrid camera, gimbal, LED panel',
      relatedSpecs: ['Social Media', 'Cafe', 'Launch'],
    },
  ],
};

async function clearDatabase() {
  await prisma.platformRevenue.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.projectHistory.deleteMany();
  await prisma.freelancerReview.deleteMany();
  await prisma.portfolioMedia.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.offering.deleteMany();
  await prisma.projectApplication.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function createProjectHistory(projectId, actorId, title, body, eventType) {
  return prisma.projectHistory.create({
    data: { projectId, actorId, title, body, eventType },
  });
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
        wallet: {
          create: {
            balance: data.role === 'CLIENT' ? 250000 : data.role === 'BOTH' ? 600000 : 450000,
          },
        },
      },
    });
  }

  for (const [key, offerings] of Object.entries(offeringsByUser)) {
    await prisma.offering.createMany({
      data: offerings.map((offering) => ({
        ...offering,
        freelancerId: createdUsers[key].id,
      })),
    });
  }

  for (const [key, items] of Object.entries(portfolioByUser)) {
    for (const item of items) {
      const { media, ...portfolio } = item;
      await prisma.portfolioItem.create({
        data: {
          ...portfolio,
          fileUrl: media[0],
          fileName: media[0].split('/').pop(),
          fileType: 'image/jpeg',
          fileSize: 320000,
          freelancerId: createdUsers[key].id,
          media: {
            create: media.slice(0, 5).map((fileUrl, index) => ({
              fileUrl,
              fileName: fileUrl.split('/').pop(),
              fileType: 'image/jpeg',
              fileSize: 320000 + index * 12000,
              sortOrder: index,
            })),
          },
        },
      });
    }
  }

  const openWedding = await prisma.project.create({
    data: {
      title: 'Dokumentasi Pre-wedding Urban',
      description: 'Mencari fotografer untuk pre-wedding outdoor dengan mood editorial dan city light.',
      category: 'wedding',
      serviceType: 'Wedding Photography',
      province: 'Jawa Timur',
      city: 'Surabaya',
      district: 'Tegalsari',
      village: 'Kedungdoro',
      postalCode: '60261',
      address: 'Surabaya, Jawa Timur',
      addressDetail: 'Area Tunjungan, detail lokasi dikirim setelah freelancer dipilih.',
      latitude: -7.2575,
      longitude: 112.7521,
      locationSource: 'seed',
      budget: 2800000,
      eventDate: new Date('2026-06-14T15:00:00+07:00'),
      deadline: new Date('2026-06-20T18:00:00+07:00'),
      status: 'OPEN',
      progress: 0,
      clientId: createdUsers.clientA.id,
    },
  });

  const openProduct = await prisma.project.create({
    data: {
      title: 'Product Shoot Kopi Lokal',
      description: 'Butuh foto produk kopi untuk katalog marketplace dan konten Instagram.',
      category: 'product',
      serviceType: 'Product Shoot',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      village: 'Melawai',
      postalCode: '12160',
      address: 'Jakarta Selatan, DKI Jakarta',
      addressDetail: 'Studio kecil di dekat Blok M.',
      latitude: -6.2445,
      longitude: 106.7991,
      locationSource: 'seed',
      budget: 1500000,
      eventDate: new Date('2026-06-18T10:00:00+07:00'),
      deadline: new Date('2026-06-22T18:00:00+07:00'),
      status: 'OPEN',
      progress: 0,
      clientId: createdUsers.clientB.id,
    },
  });

  await prisma.projectApplication.create({
    data: {
      projectId: openProduct.id,
      freelancerId: createdUsers.raka.id,
      serviceType: 'Product Shoot',
      message: 'Saya bisa bantu katalog produk dengan setup clean dan cepat.',
      status: 'PENDING',
    },
  });

  await createProjectHistory(openWedding.id, createdUsers.clientA.id, 'Job request dibuat', 'Client membuka request pre-wedding untuk freelancer.', 'PROJECT_CREATED');
  await createProjectHistory(openProduct.id, createdUsers.clientB.id, 'Job request dibuat', 'Client membuka request product shoot untuk freelancer.', 'PROJECT_CREATED');

  const activeProject = await prisma.project.create({
    data: {
      title: 'Company Profile Klinik',
      description: 'Video company profile singkat untuk kebutuhan website dan sosial media.',
      category: 'corporate',
      serviceType: 'Corporate Video',
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Coblong',
      village: 'Dago',
      postalCode: '40135',
      address: 'Bandung, Jawa Barat',
      addressDetail: 'Klinik dekat Dago Atas.',
      latitude: -6.8839,
      longitude: 107.6139,
      locationSource: 'seed',
      budget: 4200000,
      eventDate: new Date('2026-06-08T09:00:00+07:00'),
      deadline: new Date('2026-06-16T18:00:00+07:00'),
      status: 'IN_PROGRESS',
      progress: 45,
      clientId: createdUsers.clientB.id,
      freelancerId: createdUsers.maya.id,
    },
  });

  await createProjectHistory(activeProject.id, createdUsers.clientB.id, 'Freelancer dipilih', 'Maya Visual mulai mengerjakan company profile.', 'APPLICATION_ACCEPTED');
  await createProjectHistory(activeProject.id, createdUsers.maya.id, 'Draft pertama dikirim', 'Freelancer mengirim draft awal untuk direview client.', 'SUBMISSION_CREATED');

  const completedProjects = [
    {
      clientKey: 'clientA',
      freelancerKey: 'raka',
      title: 'Wedding Intimate Surabaya',
      description: 'Dokumentasi wedding intimate dengan 150 tamu.',
      category: 'wedding',
      serviceType: 'Wedding Photography',
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
      serviceType: 'Fashion Reel',
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
      serviceType: 'Social Media Content',
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
        deliveredAt: new Date('2026-05-14T18:00:00+07:00'),
        completedAt: new Date('2026-05-15T11:00:00+07:00'),
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

    await createProjectHistory(project.id, createdUsers[item.clientKey].id, 'Project selesai', `${item.title} selesai dan diulas oleh client.`, 'PROJECT_COMPLETED');
  }

  await prisma.message.createMany({
    data: [
      {
        senderId: createdUsers.clientA.id,
        receiverId: createdUsers.raka.id,
        body: 'Halo Raka, saya suka tone portfolio wedding kamu. Bisa diskusi brief?',
      },
      {
        senderId: createdUsers.maya.id,
        receiverId: createdUsers.clientB.id,
        body: 'Draft awal company profile sudah saya kirim untuk review.',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: createdUsers.raka.id,
        type: 'PROJECT',
        title: 'Ada request product shoot baru',
        body: 'Bima membuka project Product Shoot Kopi Lokal yang bisa kamu apply.',
      },
      {
        userId: createdUsers.clientB.id,
        type: 'MESSAGE',
        title: 'Pesan baru dari Maya Visual',
        body: 'Maya mengirim update draft project company profile.',
      },
      {
        userId: createdUsers.clientA.id,
        type: 'PROJECT',
        title: 'Job request berhasil dibuat',
        body: 'Request pre-wedding kamu sudah tampil untuk freelancer.',
      },
    ],
  });

  await prisma.walletTransaction.createMany({
    data: [
      {
        userId: createdUsers.raka.id,
        type: 'CREDIT',
        amount: 3500000,
        balanceAfter: 450000,
        description: 'Dummy saldo dari project wedding selesai',
        referenceType: 'SEED',
      },
      {
        userId: createdUsers.maya.id,
        type: 'CREDIT',
        amount: 4200000,
        balanceAfter: 450000,
        description: 'Dummy saldo dari project lookbook selesai',
        referenceType: 'SEED',
      },
    ],
  });

  console.log(`Reset database and seeded ${users.length} demo accounts. Password: ${password}`);
  users.forEach((user) => console.log(`- ${user.email} (${user.role})`));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
