const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const generateToken = require('../utils/generateToken');

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
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
