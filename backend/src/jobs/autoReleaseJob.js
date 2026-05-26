const prisma = require('../config/prisma');
const { completeProjectSettlement } = require('../controllers/paymentController');

const ONE_HOUR_MS = 60 * 60 * 1000;

const runAutoRelease = async () => {
  const projects = await prisma.project.findMany({
    where: {
      status: 'DELIVERED',
      autoReleaseAt: { lte: new Date() },
    },
    select: {
      id: true,
      clientId: true,
      title: true,
    },
    take: 25,
  });

  for (const project of projects) {
    try {
      await completeProjectSettlement(project.id, null, 'AUTO_COMPLETED');
      await prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PAYMENT',
          title: 'Dana auto-release',
          body: `Dana untuk ${project.title} otomatis diteruskan karena tidak ada konfirmasi dalam 72 jam.`,
        },
      });
    } catch (error) {
      console.error(`Auto-release gagal untuk project ${project.id}:`, error.message);
    }
  }
};

const startAutoReleaseJob = () => {
  if (process.env.NODE_ENV === 'test') return;

  setTimeout(() => {
    runAutoRelease().catch((error) => console.error('Auto-release job gagal:', error.message));
  }, 30 * 1000);

  setInterval(() => {
    runAutoRelease().catch((error) => console.error('Auto-release job gagal:', error.message));
  }, ONE_HOUR_MS);
};

module.exports = {
  runAutoRelease,
  startAutoReleaseJob,
};
