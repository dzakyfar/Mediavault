const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const generateToken = require('../utils/generateToken');
const { resolveUserMedia } = require('../utils/mediaUrls');
const { validatePortfolioMediaFiles } = require('../utils/uploadLimits');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUserSelect = {
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
};

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).toUpperCase();
  return ['CLIENT', 'FREELANCER', 'BOTH'].includes(normalized) ? normalized : null;
};

const parseOptionalCoordinate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (!fullName || !email || !password || !phone) {
      res.status(400);
      throw new Error('Nama lengkap, email, nomor telepon, dan password wajib diisi');
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
        phone: String(phone).trim(),
        passwordHash,
        role: normalizeRole(role),
        isAvailable: false,
      },
      select: publicUserSelect,
    });

    res.status(201).json({
      user: await resolveUserMedia(user),
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
      user: await resolveUserMedia(user),
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, acceptedTerms, password, phone } = req.body;

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

    if (!existingUser && !acceptedTerms) {
      res.status(428);
      throw new Error('GOOGLE_SIGNUP_REQUIRES_CONSENT');
    }

    if (!existingUser && (!password || String(password).length < 8)) {
      res.status(400);
      throw new Error('Password lokal minimal 8 karakter untuk akun Google baru');
    }

    if (!existingUser && !String(phone || '').trim()) {
      res.status(400);
      throw new Error('Nomor telepon wajib diisi untuk akun Google baru');
    }

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
          passwordHash: await bcrypt.hash(password, 12),
          phone: String(phone).trim(),
          role: null,
          isAvailable: false,
        },
        select: publicUserSelect,
      });

    res.json({
      user: await resolveUserMedia(user),
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.registerFreelancer = async (req, res, next) => {
  try {
    const {
      fullName,
      bio,
      categories,
      experienceYears,
      startingPrice,
      province,
      city,
      district,
      village,
      postalCode,
      addressDetail,
      latitude,
      longitude,
      locationSource,
      portfolio,
      agreed,
    } = req.body;

    const selectedCategories = Array.isArray(categories)
      ? categories.map((category) => String(category).trim()).filter(Boolean)
      : [];
    const parsedExperience = Number(experienceYears);
    const parsedPrice = Number(startingPrice);

    if (!fullName?.trim()) {
      res.status(400);
      throw new Error('Nama lengkap wajib diisi');
    }

    if (!bio?.trim()) {
      res.status(400);
      throw new Error('Bio/deskripsi wajib diisi');
    }

    if (selectedCategories.length === 0) {
      res.status(400);
      throw new Error('Pilih minimal satu kategori keahlian');
    }

    if (!Number.isFinite(parsedExperience) || parsedExperience < 0) {
      res.status(400);
      throw new Error('Pengalaman tahun wajib diisi dengan angka valid');
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 1) {
      res.status(400);
      throw new Error('Harga mulai wajib diisi');
    }

    if (!province?.trim() || !city?.trim() || !district?.trim() || !village?.trim() || !addressDetail?.trim()) {
      res.status(400);
      throw new Error('Alamat lengkap freelancer wajib diisi');
    }

    if (!agreed) {
      res.status(400);
      throw new Error('Persetujuan syarat & ketentuan freelancer wajib dicentang');
    }

    const portfolioFiles = Array.isArray(portfolio?.files)
      ? portfolio.files
      : portfolio?.fileUrl
        ? [{
          fileUrl: portfolio.fileUrl,
          fileName: portfolio.fileName,
          fileType: portfolio.fileType,
          fileSize: portfolio.fileSize,
        }]
        : [];
    const portfolioError = validatePortfolioMediaFiles(portfolioFiles);

    if (portfolioError) {
      res.status(400);
      throw new Error(portfolioError);
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          fullName: fullName.trim(),
          bio: bio.trim(),
          specialty: selectedCategories.join(', '),
          startingPrice: Math.round(parsedPrice),
          province: province.trim(),
          city: city.trim(),
          district: district.trim(),
          village: village.trim(),
          postalCode: postalCode?.trim() || null,
          addressDetail: addressDetail.trim(),
          latitude: parseOptionalCoordinate(latitude),
          longitude: parseOptionalCoordinate(longitude),
          locationSource: locationSource || 'manual',
          isAvailable: true,
          role: req.user.role === 'FREELANCER' ? 'FREELANCER' : 'BOTH',
        },
        select: publicUserSelect,
      });

      if (portfolioFiles.length > 0) {
        const firstMedia = portfolioFiles[0];
        await tx.portfolioItem.create({
          data: {
            freelancerId: req.user.id,
            title: portfolio.title?.trim() || 'Portfolio awal freelancer',
            category: selectedCategories[0],
            serviceType: selectedCategories[0],
            description: 'Contoh karya pertama yang ditambahkan saat profil freelancer dibuat.',
            fileUrl: firstMedia.fileUrl,
            fileName: firstMedia.fileName || null,
            fileType: firstMedia.fileType || null,
            fileSize: Number.isFinite(Number(firstMedia.fileSize)) ? Number(firstMedia.fileSize) : null,
            media: {
              create: portfolioFiles.map((file, index) => ({
                fileUrl: file.fileUrl,
                fileName: file.fileName || null,
                fileType: file.fileType || null,
                fileSize: Number.isFinite(Number(file.fileSize)) ? Number(file.fileSize) : null,
                sortOrder: index,
              })),
            },
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'INFO',
          title: 'Profil freelancer aktif',
          body: 'Data freelancer berhasil dilengkapi. Client sekarang bisa menemukan dan memesan jasa kamu.',
        },
      });

      return updatedUser;
    });

    res.json({ user: await resolveUserMedia(user) });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({ user: await resolveUserMedia(req.user) });
};

exports.updateRole = async (req, res, next) => {
  try {
    const role = normalizeRole(req.body.role);

    if (!role) {
      res.status(400);
      throw new Error('Role harus CLIENT, FREELANCER, atau BOTH');
    }

    if (req.user.role && req.user.role !== role) {
      res.status(400);
      throw new Error('Role akun sudah dipilih. Gunakan onboarding freelancer jika ingin menambahkan profil freelancer.');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role },
      select: publicUserSelect,
    });

    res.json({ user: await resolveUserMedia(user) });
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
      province,
      district,
      village,
      postalCode,
      addressDetail,
      latitude,
      longitude,
      locationSource,
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
        province: province ?? undefined,
        district: district ?? undefined,
        village: village ?? undefined,
        postalCode: postalCode ?? undefined,
        addressDetail: addressDetail ?? undefined,
        latitude: parseOptionalCoordinate(latitude),
        longitude: parseOptionalCoordinate(longitude),
        locationSource: locationSource ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        bio: bio ?? undefined,
        specialty: specialty ?? undefined,
        startingPrice: Number.isFinite(parsedPrice) ? Math.round(parsedPrice) : undefined,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
      },
      select: publicUserSelect,
    });

    res.json({ user: await resolveUserMedia(user) });
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
