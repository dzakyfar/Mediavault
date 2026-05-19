const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const generateToken = require('../utils/generateToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  role: true,
  phone: true,
  city: true,
  bio: true,
  specialty: true,
  startingPrice: true,
  isAvailable: true,
  createdAt: true,
};

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).toUpperCase();
  return ['CLIENT', 'FREELANCER', 'BOTH'].includes(normalized) ? normalized : null;
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      res.status(400);
      throw new Error('Nama lengkap, email, dan password wajib diisi');
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error('Password minimal 8 karakter');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409);
      throw new Error('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: normalizeRole(role),
      },
      select: publicUserSelect,
    });

    res.status(201).json({
      user,
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email dan password wajib diisi');
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userWithPassword) {
      res.status(401);
      throw new Error('Email atau password salah');
    }

    if (!userWithPassword.passwordHash) {
      res.status(401);
      throw new Error('Akun ini terhubung dengan Google. Silakan login dengan Google.');
    }

    const passwordMatches = await bcrypt.compare(password, userWithPassword.passwordHash);

    if (!passwordMatches) {
      res.status(401);
      throw new Error('Email atau password salah');
    }

    const { passwordHash, ...user } = userWithPassword;

    res.json({
      user,
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500);
      throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi di backend');
    }

    if (!credential) {
      res.status(400);
      throw new Error('Credential Google wajib dikirim');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      res.status(400);
      throw new Error('Email Google tidak ditemukan');
    }

    const email = payload.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const user = existingUser
      ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: existingUser.googleId || payload.sub,
          avatarUrl: payload.picture || existingUser.avatarUrl,
          fullName: existingUser.fullName || payload.name || email,
        },
        select: publicUserSelect,
      })
      : await prisma.user.create({
        data: {
          fullName: payload.name || email,
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
        },
        select: publicUserSelect,
      });

    res.json({
      user,
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.updateRole = async (req, res, next) => {
  try {
    const role = normalizeRole(req.body.role);

    if (!role) {
      res.status(400);
      throw new Error('Role harus CLIENT, FREELANCER, atau BOTH');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role },
      select: publicUserSelect,
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      avatarUrl,
      bio,
      specialty,
      startingPrice,
      isAvailable,
    } = req.body;

    const parsedPrice = startingPrice === undefined || startingPrice === ''
      ? undefined
      : Number(startingPrice);

    if (email && email.toLowerCase() !== req.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        res.status(409);
        throw new Error('Email sudah digunakan akun lain');
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(email ? { email: email.toLowerCase() } : {}),
        phone: phone ?? undefined,
        city: city ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        bio: bio ?? undefined,
        specialty: specialty ?? undefined,
        startingPrice: Number.isFinite(parsedPrice) ? Math.round(parsedPrice) : undefined,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
      },
      select: publicUserSelect,
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Password lama dan password baru wajib diisi');
    }

    if (newPassword.length < 8) {
      res.status(400);
      throw new Error('Password baru minimal 8 karakter');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404);
      throw new Error('User tidak ditemukan');
    }

    if (!user.passwordHash) {
      res.status(400);
      throw new Error('Akun Google belum memiliki password lokal');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      res.status(401);
      throw new Error('Password lama tidak sesuai');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
