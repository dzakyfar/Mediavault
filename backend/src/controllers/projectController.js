const prisma = require('../config/prisma');
const { formatCurrency, serializeProject } = require('../utils/formatters');
const { validateReferenceFiles, validateSubmissionFile } = require('../utils/uploadLimits');
const { resolveProjectMedia } = require('../utils/mediaUrls');
const { completeProjectSettlement } = require('./paymentController');
const { creditWallet } = require('../services/walletService');
const { notifyTelegramOnly, notifyUser } = require('../services/notificationService');

const parseBudget = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = typeof value === 'string' ? value.replace(/[^\d]/g, '') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const projectInclude = {
  client: { select: { fullName: true } },
  freelancer: { select: { fullName: true } },
  applications: {
    where: { status: 'PENDING' },
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          specialty: true,
          startingPrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  files: true,
  reviews: true,
  _count: { select: { files: true } },
  histories: {
    orderBy: { createdAt: 'desc' },
    take: 10,
  },
  submissions: {
    orderBy: { createdAt: 'desc' },
    take: 10,
  },
  payments: {
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
};

const createProjectHistory = (projectId, actorId, title, body, eventType) =>
  prisma.projectHistory.create({
    data: { projectId, actorId, title, body, eventType },
  });

const countCharacters = (value = '') => String(value).length;

const serializeProjectWithMedia = async (project) => resolveProjectMedia(serializeProject(project));

const serializeProjectsWithMedia = async (projects) =>
  Promise.all(projects.map((project) => serializeProjectWithMedia(project)));

const allowedProgressStatuses = ['IN_PROGRESS', 'UNDER_REVIEW'];
const statusProgress = {
  IN_PROGRESS: 25,
  UNDER_REVIEW: 60,
};

const startOfTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

const parseRequiredDate = (value, label) => {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} wajib diisi dengan tanggal valid`);
  }
  return parsed;
};

const validateBriefText = ({ title, description }) => {
  if (title !== undefined && countCharacters(title) > 64) {
    throw new Error('Judul pekerjaan maksimal 64 karakter');
  }

  if (description !== undefined && countCharacters(description) > 500) {
    throw new Error('Deskripsi maksimal 500 karakter');
  }
};

const validateDeadline = (deadline) => {
  const parsedDeadline = parseRequiredDate(deadline, 'Deadline');
  if (parsedDeadline < startOfTomorrow()) {
    throw new Error('Deadline minimal H+1');
  }
  return parsedDeadline;
};

exports.listMyProjects = async (req, res, next) => {
  try {
    const requestedView = req.query.as;
    const isFreelancerView = requestedView === 'freelancer' || req.user.role === 'FREELANCER';
    const where = isFreelancerView
      ? { freelancerId: req.user.id }
      : { clientId: req.user.id };

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ projects: await serializeProjectsWithMedia(projects) });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      serviceType,
      province,
      city,
      district,
      village,
      postalCode,
      address,
      addressDetail,
      latitude,
      longitude,
      locationSource,
      budget,
      eventDate,
      deadline,
      referenceFiles,
    } = req.body;

    if (!title || !description || !category || !serviceType) {
      res.status(400);
      throw new Error('Judul, deskripsi, kategori, dan jasa yang dibutuhkan wajib diisi');
    }

    try {
      validateBriefText({ title, description });
    } catch (validationError) {
      res.status(400);
      throw validationError;
    }

    if (!eventDate || !deadline) {
      res.status(400);
      throw new Error('Tanggal pelaksanaan dan deadline wajib diisi');
    }

    const parsedBudget = parseBudget(budget);
    if (!parsedBudget || parsedBudget < 10000) {
      res.status(400);
      throw new Error('Budget minimal Rp 10.000');
    }

    let parsedEventDate;
    let parsedDeadline;
    try {
      parsedEventDate = parseRequiredDate(eventDate, 'Tanggal pelaksanaan');
      parsedDeadline = validateDeadline(deadline);
    } catch (validationError) {
      res.status(400);
      throw validationError;
    }

    if (!province || !city || !district || !village || !addressDetail) {
      res.status(400);
      throw new Error('Provinsi, kota, kecamatan, desa, dan detail alamat wajib diisi');
    }

    const referenceFileError = validateReferenceFiles(referenceFiles || []);
    if (referenceFileError) {
      res.status(400);
      throw new Error(referenceFileError);
    }

    const composedAddress = [
      addressDetail,
      village,
      district,
      city,
      province,
      postalCode,
    ].filter(Boolean).join(', ');
    const fullAddress = locationSource === 'share-location' && address ? address : composedAddress;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        serviceType,
        province,
        city: city || null,
        district,
        village,
        postalCode: postalCode || null,
        address: fullAddress,
        addressDetail,
        latitude: parseCoordinate(latitude),
        longitude: parseCoordinate(longitude),
        locationSource: locationSource || 'manual',
        budget: parsedBudget,
        eventDate: parsedEventDate,
        deadline: parsedDeadline,
        clientId: req.user.id,
        files: {
          create: (referenceFiles || []).map((file) => ({
            fileName: file.fileName,
            fileKey: file.fileUrl,
            contentType: file.fileType,
            size: Number.isFinite(Number(file.fileSize)) ? Number(file.fileSize) : null,
          })),
        },
      },
      include: projectInclude,
    });

    await createProjectHistory(
      project.id,
      req.user.id,
      'Project dibuat',
      `${req.user.fullName} membuat brief untuk ${project.title}`,
      'PROJECT_CREATED'
    );

    res.status(201).json({ project: await serializeProjectWithMedia(project) });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || project.clientId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!['DRAFT', 'OPEN'].includes(project.status)) {
      res.status(400);
      throw new Error('Project yang sudah berjalan tidak bisa diedit dari brief');
    }

    const {
      title,
      description,
      category,
      serviceType,
      province,
      city,
      district,
      village,
      postalCode,
      address,
      addressDetail,
      latitude,
      longitude,
      locationSource,
      budget,
      eventDate,
      deadline,
      referenceFiles,
    } = req.body;

    try {
      validateBriefText({ title, description });
    } catch (validationError) {
      res.status(400);
      throw validationError;
    }

    const parsedBudget = budget === undefined ? undefined : parseBudget(budget);
    if (parsedBudget !== undefined && (!parsedBudget || parsedBudget < 10000)) {
      res.status(400);
      throw new Error('Budget minimal Rp 10.000');
    }

    let parsedEventDate;
    let parsedDeadline;
    try {
      parsedEventDate = eventDate === undefined ? undefined : parseRequiredDate(eventDate, 'Tanggal pelaksanaan');
      parsedDeadline = deadline === undefined ? undefined : validateDeadline(deadline);
    } catch (validationError) {
      res.status(400);
      throw validationError;
    }
    const nextProvince = province ?? project.province;
    const nextCity = city ?? project.city;
    const nextDistrict = district ?? project.district;
    const nextVillage = village ?? project.village;
    const nextAddressDetail = addressDetail ?? project.addressDetail;

    if (!nextProvince || !nextCity || !nextDistrict || !nextVillage || !nextAddressDetail) {
      res.status(400);
      throw new Error('Provinsi, kota, kecamatan, desa, dan detail alamat wajib diisi');
    }

    const referenceFileError = referenceFiles === undefined ? null : validateReferenceFiles(referenceFiles || []);
    if (referenceFileError) {
      res.status(400);
      throw new Error(referenceFileError);
    }

    const composedAddress = [
      nextAddressDetail,
      nextVillage,
      nextDistrict,
      nextCity,
      nextProvince,
      postalCode ?? project.postalCode,
    ].filter(Boolean).join(', ');

    const updateData = {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(category ? { category } : {}),
        serviceType: serviceType ?? undefined,
        province: nextProvince,
        city: nextCity,
        district: nextDistrict,
        village: nextVillage,
        postalCode: postalCode ?? undefined,
        address: locationSource === 'share-location' && address ? address : composedAddress,
        addressDetail: nextAddressDetail,
        latitude: latitude === undefined ? undefined : parseCoordinate(latitude),
        longitude: longitude === undefined ? undefined : parseCoordinate(longitude),
        locationSource: locationSource ?? undefined,
        budget: parsedBudget,
        eventDate: parsedEventDate,
        deadline: parsedDeadline,
    };

    const updatedProject = await prisma.$transaction(async (tx) => {
      if (referenceFiles !== undefined) {
        await tx.projectFile.deleteMany({ where: { projectId } });
      }

      return tx.project.update({
        where: { id: projectId },
        data: {
          ...updateData,
          ...(referenceFiles !== undefined ? {
            files: {
              create: (referenceFiles || []).map((file) => ({
                fileName: file.fileName,
                fileKey: file.fileUrl,
                contentType: file.fileType,
                size: Number.isFinite(Number(file.fileSize)) ? Number(file.fileSize) : null,
              })),
            },
          } : {}),
        },
        include: projectInclude,
      });
    });

    await createProjectHistory(
      projectId,
      req.user.id,
      'Project diperbarui',
      `${req.user.fullName} memperbarui brief project`,
      'PROJECT_UPDATED'
    );

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          where: { status: 'PENDING' },
          select: { freelancerId: true },
        },
        payments: {
          where: { status: 'PAID' },
          take: 1,
        },
      },
    });

    if (!project || project.clientId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (project.payments.length > 0 || ['PAID', 'IN_PROGRESS', 'CONFIRMED', 'UNDER_REVIEW', 'DELIVERED', 'COMPLETED', 'AUTO_COMPLETED', 'DISPUTED'].includes(project.status)) {
      res.status(400);
      throw new Error('Project yang sudah dibayar atau berjalan tidak bisa dihapus. Gunakan alur pembatalan/refund.');
    }

    await prisma.$transaction([
      prisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'PROJECT',
          title: 'Project dihapus',
          body: `Anda menghapus project "${project.title}".`,
        },
      }),
      ...project.applications.map((application) => prisma.notification.create({
        data: {
          userId: application.freelancerId,
          type: 'PROJECT',
          title: 'Job request dihapus client',
          body: `Job "${project.title}" sudah dihapus oleh client dan tidak tersedia lagi.`,
        },
      })),
      prisma.project.delete({ where: { id: projectId } }),
    ]);
    res.json({ message: 'Project berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

exports.listOpenProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: 'OPEN',
        clientId: { not: req.user.id },
      },
      include: {
        client: { select: { fullName: true } },
        freelancer: { select: { fullName: true } },
        applications: {
          where: { status: 'PENDING' },
          include: {
            freelancer: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                specialty: true,
                startingPrice: true,
              },
            },
          },
        },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects: await serializeProjectsWithMedia(projects) });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        OR: [
          { clientId: req.user.id },
          { freelancerId: req.user.id },
          { status: 'OPEN' },
        ],
      },
      include: projectInclude,
    });

    if (!project) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    res.json({ project: await serializeProjectWithMedia(project) });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectProgress = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, progress, note } = req.body;

    const normalizedStatus = String(status || '').toUpperCase();
    if (!allowedProgressStatuses.includes(normalizedStatus)) {
      res.status(400);
      throw new Error('Status tracking tidak valid');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: { select: { fullName: true } }, freelancer: { select: { fullName: true } } },
    });

    if (!project || (project.clientId !== req.user.id && project.freelancerId !== req.user.id)) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!project.freelancerId) {
      res.status(400);
      throw new Error('Project belum memiliki freelancer');
    }

    if (project.freelancerId !== req.user.id) {
      res.status(403);
      throw new Error('Hanya freelancer yang mengerjakan project ini yang bisa mengubah progress');
    }

    if (!['PAID', 'CONFIRMED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(project.status)) {
      res.status(400);
      throw new Error('Progress hanya bisa diubah setelah project dibayar dan mulai dikerjakan');
    }

    const nextProgress = Math.max(
      statusProgress[normalizedStatus],
      Math.min(100, Math.max(0, Number(progress) || statusProgress[normalizedStatus]))
    );

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: normalizedStatus,
        progress: nextProgress,
      },
      include: projectInclude,
    });

    await Promise.all([
      createProjectHistory(
        projectId,
        req.user.id,
        `Progress: ${normalizedStatus.replaceAll('_', ' ')}`,
        note || `${req.user.fullName} memperbarui progress project menjadi ${nextProgress}%`,
        'PROJECT_PROGRESS_UPDATED'
      ),
      prisma.notification.create({
        data: {
          userId: req.user.id === project.clientId ? project.freelancerId : project.clientId,
          type: 'PROJECT',
          title: 'Progress project diperbarui',
          body: `${project.title} sekarang berada di tahap ${normalizedStatus.replaceAll('_', ' ').toLowerCase()}`,
        },
      }),
    ]);

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.submitProjectReview = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { comment, fileUrl, fileName, fileType, fileSize } = req.body;

    if (!comment?.trim()) {
      res.status(400);
      throw new Error('Komentar progress wajib diisi');
    }

    const fileError = validateSubmissionFile({ fileUrl, fileType, fileSize });
    if (fileError) {
      res.status(400);
      throw new Error(fileError);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: { select: { fullName: true } }, freelancer: { select: { fullName: true } } },
    });

    if (!project || project.freelancerId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan atau bukan project Anda');
    }

    if (!['PAID', 'CONFIRMED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(project.status)) {
      res.status(400);
      throw new Error('Hasil hanya bisa dikirim setelah project dibayar atau sedang berjalan');
    }

    const deliveredAt = new Date();
    const autoReleaseAt = new Date(deliveredAt.getTime() + 72 * 60 * 60 * 1000);

    const [submission, updatedProject] = await prisma.$transaction([
      prisma.projectSubmission.create({
        data: {
          projectId,
          freelancerId: req.user.id,
          comment: comment.trim(),
          fileUrl,
          fileName: fileName || null,
          fileType,
          fileSize: Number.isFinite(Number(fileSize)) ? Number(fileSize) : null,
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'DELIVERED',
          progress: Math.max(project.progress, 85),
          deliveredAt,
          autoReleaseAt,
        },
        include: projectInclude,
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        'Hasil pekerjaan dikirim',
        comment.trim(),
        'PROJECT_DELIVERED'
      ),
      prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PROJECT',
          title: 'Hasil pekerjaan siap direview',
          body: `${req.user.fullName} mengirim hasil untuk ${project.title}. Harap review dalam 72 jam.`,
        },
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: project.clientId,
          body: `Saya mengirim hasil pekerjaan untuk "${project.title}". Komentar: ${comment.trim()}`,
        },
      }),
    ]);

    await notifyTelegramOnly({
      userId: project.clientId,
      title: 'Hasil pekerjaan siap direview',
      body: `${req.user.fullName} mengirim hasil untuk ${project.title}. Harap review dalam 72 jam.`,
      actionPath: `/dashboard/client/projects/${project.id}`,
    });

    res.status(201).json({ submission, project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.reviewProjectSubmission = async (req, res, next) => {
  try {
    const { projectId, submissionId } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'revision'].includes(action)) {
      res.status(400);
      throw new Error('Action harus approve atau revision');
    }

    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: true,
      },
    });

    if (!submission || submission.projectId !== projectId || submission.project.clientId !== req.user.id) {
      res.status(404);
      throw new Error('Submission tidak ditemukan');
    }

    if (submission.status !== 'PENDING') {
      res.status(400);
      throw new Error('Submission ini sudah direview');
    }

    const approved = action === 'approve';
    const reviewComment = comment?.trim() || (approved
      ? 'Pekerjaan dikonfirmasi selesai oleh client'
      : 'Client meminta revisi hasil pekerjaan');

    if (approved) {
      await prisma.$transaction([
        prisma.projectSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'APPROVED',
            reviewComment,
            reviewedAt: new Date(),
          },
        }),
        createProjectHistory(
          projectId,
          req.user.id,
          'Pekerjaan dikonfirmasi selesai',
          reviewComment,
          'SUBMISSION_APPROVED'
        ),
        prisma.notification.create({
          data: {
            userId: submission.freelancerId,
            type: 'PROJECT',
            title: 'Pekerjaan disetujui client',
            body: 'Client mengkonfirmasi pekerjaan selesai. Dana diteruskan ke saldo kamu.',
          },
        }),
        prisma.message.create({
          data: {
            senderId: req.user.id,
            receiverId: submission.freelancerId,
            body: `Pekerjaan untuk "${submission.project.title}" saya konfirmasi selesai. ${reviewComment}`,
          },
        }),
      ]);

      await completeProjectSettlement(projectId, req.user.id, 'COMPLETED');

      await notifyTelegramOnly({
        userId: submission.freelancerId,
        title: 'Pekerjaan disetujui client',
        body: 'Client mengkonfirmasi pekerjaan selesai. Dana diteruskan ke saldo kamu.',
        actionPath: `/dashboard/freelancer/projects/${projectId}`,
      });

      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: projectInclude,
      });

      res.json({ project: await serializeProjectWithMedia(updatedProject) });
      return;
    }

    const [, updatedProject] = await prisma.$transaction([
      prisma.projectSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REVISION_REQUESTED',
          reviewComment,
          reviewedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'IN_PROGRESS',
          progress: 45,
          deliveredAt: null,
          autoReleaseAt: null,
        },
        include: projectInclude,
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        'Revisi diminta',
        reviewComment,
        'SUBMISSION_REVISION_REQUESTED'
      ),
      prisma.notification.create({
        data: {
          userId: submission.freelancerId,
          type: 'PROJECT',
          title: 'Client meminta revisi',
          body: reviewComment,
        },
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: submission.freelancerId,
          body: `Revisi diminta untuk "${submission.project.title}": ${reviewComment}`,
        },
      }),
    ]);

    await notifyTelegramOnly({
      userId: submission.freelancerId,
      title: 'Client meminta revisi',
      body: reviewComment,
      actionPath: `/dashboard/freelancer/projects/${projectId}`,
    });

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.reviewFreelancer = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rating, comment } = req.body;
    const parsedRating = Number(rating);
    const normalizedComment = comment?.trim();

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400);
      throw new Error('Rating harus bernilai 1 sampai 5');
    }

    if (!normalizedComment) {
      res.status(400);
      throw new Error('Ulasan wajib diisi');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { fullName: true } },
        freelancer: { select: { id: true, fullName: true } },
      },
    });

    if (!project || project.clientId !== req.user.id || !project.freelancerId) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!['COMPLETED', 'AUTO_COMPLETED'].includes(project.status)) {
      res.status(400);
      throw new Error('Ulasan hanya bisa diberikan setelah pekerjaan selesai');
    }

    await prisma.$transaction([
      prisma.freelancerReview.upsert({
        where: { projectId },
        update: {
          rating: parsedRating,
          comment: normalizedComment,
        },
        create: {
          projectId,
          clientId: req.user.id,
          freelancerId: project.freelancerId,
          rating: parsedRating,
          comment: normalizedComment,
        },
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        'Ulasan freelancer diberikan',
        `${req.user.fullName} memberi rating ${parsedRating}/5 untuk ${project.freelancer.fullName}`,
        'FREELANCER_REVIEW_CREATED'
      ),
      prisma.notification.create({
        data: {
          userId: project.freelancerId,
          type: 'PROJECT',
          title: 'Ulasan baru diterima',
          body: `${req.user.fullName} memberi rating ${parsedRating}/5 untuk ${project.title}`,
        },
      }),
    ]);

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.applyToProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message, serviceType } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, clientId: true, status: true },
    });

    if (!project || project.status !== 'OPEN') {
      res.status(400);
      throw new Error('Job tidak tersedia untuk direquest');
    }

    if (project.clientId === req.user.id) {
      res.status(400);
      throw new Error('Tidak bisa request job milik akun sendiri');
    }

    const existingApplication = await prisma.projectApplication.findUnique({
      where: {
        projectId_freelancerId: {
          projectId,
          freelancerId: req.user.id,
        },
      },
    });

    if (existingApplication?.status === 'PENDING') {
      res.status(400);
      throw new Error('Anda sudah mengirim request untuk job ini');
    }

    if (existingApplication?.status === 'ACCEPTED') {
      res.status(400);
      throw new Error('Anda sudah diterima untuk job ini');
    }

    const application = existingApplication
      ? await prisma.projectApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: 'PENDING',
          message: message || `Saya tertarik mengambil job ${project.title}`,
          serviceType,
        },
      })
      : await prisma.projectApplication.create({
        data: {
          projectId,
          freelancerId: req.user.id,
          message: message || `Saya tertarik mengambil job ${project.title}`,
          serviceType,
        },
      });

    await Promise.all([
      notifyUser({
        userId: project.clientId,
        type: 'PROJECT',
        title: 'Freelancer mengirim request job',
        body: `${req.user.fullName} mengirim request untuk ${project.title}`,
        actionPath: `/dashboard/client/projects/${project.id}`,
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: project.clientId,
          body: message || `Saya tertarik mengambil job "${project.title}".`,
        },
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        existingApplication ? 'Request job dikirim ulang' : 'Request job masuk',
        `${req.user.fullName} mengirim request untuk ${project.title}`,
        existingApplication ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_CREATED'
      ),
    ]);

    res.status(201).json({ application });
  } catch (error) {
    next(error);
  }
};

exports.cancelProjectApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: { select: { id: true, title: true, clientId: true, status: true } },
      },
    });

    if (!application || application.freelancerId !== req.user.id) {
      res.status(404);
      throw new Error('Request job tidak ditemukan');
    }

    if (application.status !== 'PENDING' || application.project.status !== 'OPEN') {
      res.status(400);
      throw new Error('Request job sudah diproses dan tidak bisa dibatalkan');
    }

    await prisma.$transaction([
      prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
      }),
      prisma.notification.create({
        data: {
          userId: application.project.clientId,
          type: 'PROJECT',
          title: 'Request job dibatalkan',
          body: `${req.user.fullName} membatalkan request untuk ${application.project.title}`,
        },
      }),
      createProjectHistory(
        application.projectId,
        req.user.id,
        'Request job dibatalkan',
        `${req.user.fullName} membatalkan request untuk ${application.project.title}`,
        'APPLICATION_CANCELLED'
      ),
    ]);

    res.json({ message: 'Request job berhasil dibatalkan' });
  } catch (error) {
    next(error);
  }
};

exports.respondToApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      res.status(400);
      throw new Error('Action harus accept atau decline');
    }

    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        freelancer: { select: { id: true, fullName: true } },
      },
    });

    if (!application || application.project.clientId !== req.user.id) {
      res.status(404);
      throw new Error('Offer tidak ditemukan');
    }

    if (application.status !== 'PENDING' || application.project.status !== 'OPEN') {
      res.status(400);
      throw new Error('Offer sudah diproses atau job tidak lagi open');
    }

    if (action === 'accept') {
      const [, , updatedProject] = await prisma.$transaction([
        prisma.projectApplication.update({
          where: { id: applicationId },
          data: { status: 'ACCEPTED' },
        }),
        prisma.projectApplication.updateMany({
          where: {
            projectId: application.projectId,
            id: { not: applicationId },
            status: 'PENDING',
          },
          data: { status: 'REJECTED' },
        }),
        prisma.project.update({
          where: { id: application.projectId },
          data: {
            freelancerId: application.freelancerId,
            status: 'WAITING_PAYMENT',
            progress: 20,
          },
          include: projectInclude,
        }),
        prisma.notification.create({
          data: {
            userId: application.freelancerId,
          type: 'PROJECT',
          title: 'Offer diterima, menunggu pembayaran',
          body: `${req.user.fullName} menerima request Anda untuk ${application.project.title}. Project menunggu pembayaran client.`,
        },
      }),
        prisma.message.create({
          data: {
          senderId: req.user.id,
          receiverId: application.freelancerId,
          body: `Request Anda untuk "${application.project.title}" diterima. Client akan menyelesaikan pembayaran QRIS terlebih dahulu.`,
        },
      }),
        createProjectHistory(
          application.projectId,
          req.user.id,
          'Request diterima, menunggu pembayaran',
          `${application.freelancer.fullName} dipilih untuk ${application.project.title}. Project menunggu pembayaran QRIS.`,
          'APPLICATION_ACCEPTED'
        ),
      ]);

      await notifyTelegramOnly({
        userId: application.freelancerId,
        title: 'Request job diterima',
        body: `${req.user.fullName} menerima request Anda untuk ${application.project.title}. Project menunggu pembayaran client.`,
        actionPath: `/dashboard/freelancer/projects/${application.projectId}`,
      });

      res.json({ project: await serializeProjectWithMedia(updatedProject) });
      return;
    }

    const rejectTransaction = [
      prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
      }),
      prisma.notification.create({
        data: {
          userId: application.freelancerId,
          type: 'PROJECT',
          title: 'Offer ditolak',
          body: `${req.user.fullName} menolak request Anda untuk ${application.project.title}`,
        },
      }),
      createProjectHistory(
        application.projectId,
        req.user.id,
        'Request ditolak',
        `Request ${application.freelancer.fullName} untuk ${application.project.title} ditolak`,
        'APPLICATION_REJECTED'
      ),
    ];

    if (application.project.freelancerId === application.freelancerId) {
      rejectTransaction.push(
        prisma.project.update({
          where: { id: application.projectId },
          data: {
            freelancerId: null,
            status: 'OPEN',
            progress: 0,
          },
        })
      );
    }

    await prisma.$transaction(rejectTransaction);

    await notifyTelegramOnly({
      userId: application.freelancerId,
      title: 'Request job ditolak',
      body: `${req.user.fullName} menolak request Anda untuk ${application.project.title}.`,
      actionPath: '/dashboard/freelancer/requests',
    });

    res.json({ message: 'Offer ditolak' });
  } catch (error) {
    next(error);
  }
};

exports.confirmProjectByFreelancer = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        clientId: true,
        freelancerId: true,
        status: true,
      },
    });

    if (!project || project.freelancerId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!['PAID', 'IN_PROGRESS'].includes(project.status)) {
      res.status(400);
      throw new Error('Project belum siap diterima freelancer');
    }

    const nextStatus = project.status === 'PAID' ? 'IN_PROGRESS' : 'CONFIRMED';
    const nextProgress = project.status === 'PAID' ? 45 : 25;

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: nextStatus,
          progress: nextProgress,
        },
        include: projectInclude,
      }),
      prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PROJECT',
          title: 'Freelancer menerima order',
          body: `${req.user.fullName} menerima order ${project.title} dan mulai mengerjakan.`,
        },
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        'Order diterima freelancer',
        `${req.user.fullName} menerima project ${project.title}`,
        'PROJECT_CONFIRMED_BY_FREELANCER'
      ),
    ]);

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.rejectPaidProjectByFreelancer = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: {
          where: { status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project || project.freelancerId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (project.status !== 'PAID') {
      res.status(400);
      throw new Error('Order hanya bisa ditolak setelah pembayaran berhasil dan sebelum pekerjaan dimulai');
    }

    const paidPayment = project.payments[0];
    const refundAmount = paidPayment?.baseAmount || project.budget || 0;

    const updatedProject = await prisma.$transaction(async (tx) => {
      const nextProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'CANCELLED',
          progress: 0,
        },
        include: projectInclude,
      });

      await creditWallet(
        tx,
        project.clientId,
        refundAmount,
        `Refund order ${project.title} karena ditolak freelancer.`,
        'PROJECT',
        projectId
      );

      await tx.projectHistory.create({
        data: {
          projectId,
          actorId: req.user.id,
          title: 'Order ditolak freelancer',
          body: `Dana ${formatCurrency(refundAmount)} dikembalikan ke saldo client di MediaVault.`,
          eventType: 'PROJECT_REJECTED_REFUNDED',
        },
      });

      await tx.notification.create({
        data: {
          userId: project.clientId,
          type: 'PAYMENT',
          title: 'Order ditolak, dana masuk saldo',
          body: `${req.user.fullName} menolak order ${project.title}. Dana ${formatCurrency(refundAmount)} masuk ke saldo kamu.`,
        },
      });

      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'PROJECT',
          title: 'Order ditolak',
          body: `Kamu menolak order ${project.title}. Dana client dikembalikan sebagai saldo internal.`,
        },
      });

      return nextProject;
    });

    res.json({ project: await serializeProjectWithMedia(updatedProject) });
  } catch (error) {
    next(error);
  }
};
