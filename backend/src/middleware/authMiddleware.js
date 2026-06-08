const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Token autentikasi tidak ditemukan');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        phone: true,
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
        city: true,
        province: true,
        district: true,
        village: true,
        postalCode: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        bio: true,
        specialty: true,
        startingPrice: true,
        isAvailable: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401);
      throw new Error('User tidak ditemukan');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    res.status(403);
    return next(new Error('Role user tidak memiliki akses ke resource ini'));
  }

  next();
};

module.exports = { protect, requireRole };
