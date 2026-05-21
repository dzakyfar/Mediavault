const prisma = require('../config/prisma');
const { serializeProject } = require('../utils/formatters');
const { validateReferenceFiles, validateSubmissionFile } = require('../utils/uploadLimits');

const parseBudget = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
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
};

const createProjectHistory = (projectId, actorId, title, body, eventType) =>
  prisma.projectHistory.create({
    data: { projectId, actorId, title, body, eventType },
  });

const allowedProgressStatuses = ['IN_PROGRESS', 'UNDER_REVIEW', 'WAITING_PAYMENT', 'COMPLETED'];
const statusProgress = {
  IN_PROGRESS: 25,
  UNDER_REVIEW: 60,
  WAITING_PAYMENT: 85,
  COMPLETED: 100,
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

    res.json({ projects: projects.map(serializeProject) });
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
    } = req.body;

    if (!title || !description || !category || !serviceType) {
      res.status(400);
      throw new Error('Judul, deskripsi, kategori, dan jasa yang dibutuhkan wajib diisi');
    }

    if (!eventDate || !deadline) {
      res.status(400);
      throw new Error('Tanggal pelaksanaan dan deadline wajib diisi');
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
        budget: parseBudget(budget),
        eventDate: eventDate ? new Date(eventDate) : null,
        deadline: deadline ? new Date(deadline) : null,
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

    res.status(201).json({ project: serializeProject(project) });
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

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(category ? { category } : {}),
        serviceType: serviceType ?? undefined,
        province: province ?? undefined,
        city: city ?? undefined,
        district: district ?? undefined,
        village: village ?? undefined,
        postalCode: postalCode ?? undefined,
        address: address ?? undefined,
        addressDetail: addressDetail ?? undefined,
        latitude: latitude === undefined ? undefined : parseCoordinate(latitude),
        longitude: longitude === undefined ? undefined : parseCoordinate(longitude),
        locationSource: locationSource ?? undefined,
        budget: budget === undefined ? undefined : parseBudget(budget),
        eventDate: eventDate ? new Date(eventDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      },
      include: projectInclude,
    });

    await createProjectHistory(
      projectId,
      req.user.id,
      'Project diperbarui',
      `${req.user.fullName} memperbarui brief project`,
      'PROJECT_UPDATED'
    );

    res.json({ project: serializeProject(updatedProject) });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || project.clientId !== req.user.id) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!['DRAFT', 'OPEN', 'CANCELLED'].includes(project.status)) {
      res.status(400);
      throw new Error('Project yang sudah berjalan tidak bisa dihapus. Batalkan alur melalui status project.');
    }

    await prisma.project.delete({ where: { id: projectId } });
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

    res.json({ projects: projects.map(serializeProject) });
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

    res.json({ project: serializeProject(project) });
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

    res.json({ project: serializeProject(updatedProject) });
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

    if (!['IN_PROGRESS', 'UNDER_REVIEW'].includes(project.status)) {
      res.status(400);
      throw new Error('Draft hanya bisa dikirim saat project sedang berjalan atau revisi');
    }

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
          status: 'UNDER_REVIEW',
          progress: Math.max(project.progress, 60),
        },
        include: projectInclude,
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        'Draft dikirim untuk review',
        comment.trim(),
        'SUBMISSION_CREATED'
      ),
      prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PROJECT',
          title: 'Draft project siap direview',
          body: `${req.user.fullName} mengirim draft untuk ${project.title}`,
        },
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: project.clientId,
          body: `Saya mengirim draft untuk "${project.title}". Komentar: ${comment.trim()}`,
        },
      }),
    ]);

    res.status(201).json({ submission, project: serializeProject(updatedProject) });
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
    const nextStatus = approved ? 'WAITING_PAYMENT' : 'IN_PROGRESS';
    const nextProgress = approved ? 85 : 45;
    const reviewComment = comment?.trim() || (approved
      ? 'Draft disetujui oleh client'
      : 'Client meminta revisi draft');

    const [, updatedProject] = await prisma.$transaction([
      prisma.projectSubmission.update({
        where: { id: submissionId },
        data: {
          status: approved ? 'APPROVED' : 'REVISION_REQUESTED',
          reviewComment,
          reviewedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: nextStatus,
          progress: nextProgress,
        },
        include: projectInclude,
      }),
      createProjectHistory(
        projectId,
        req.user.id,
        approved ? 'Draft disetujui' : 'Revisi diminta',
        reviewComment,
        approved ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REVISION_REQUESTED'
      ),
      prisma.notification.create({
        data: {
          userId: submission.freelancerId,
          type: 'PROJECT',
          title: approved ? 'Draft project disetujui' : 'Client meminta revisi',
          body: approved
            ? `${submission.project.title} masuk tahap menunggu pembayaran`
            : reviewComment,
        },
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: submission.freelancerId,
          body: approved
            ? `Draft untuk "${submission.project.title}" disetujui. Project masuk tahap menunggu pembayaran.`
            : `Revisi diminta untuk "${submission.project.title}": ${reviewComment}`,
        },
      }),
    ]);

    res.json({ project: serializeProject(updatedProject) });
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

    if (!['WAITING_PAYMENT', 'COMPLETED'].includes(project.status)) {
      res.status(400);
      throw new Error('Ulasan hanya bisa diberikan setelah draft disetujui');
    }

    const [, updatedProject] = await prisma.$transaction([
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
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'COMPLETED',
          progress: 100,
        },
        include: projectInclude,
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

    res.json({ project: serializeProject(updatedProject) });
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

    const existingApplication = await prisma.projectApplication.findUnique({
      where: {
        projectId_freelancerId: {
          projectId,
          freelancerId: req.user.id,
        },
      },
    });

    if (existingApplication) {
      res.status(409);
      throw new Error('Anda sudah request job ini');
    }

    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        freelancerId: req.user.id,
        message: message || `Saya tertarik mengambil job ${project.title}`,
        serviceType,
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
      prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PROJECT',
          title: 'Freelancer mengirim request job',
          body: `${req.user.fullName} mengirim request untuk ${project.title}`,
        },
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
            status: 'IN_PROGRESS',
            progress: 10,
          },
          include: projectInclude,
        }),
        prisma.notification.create({
          data: {
            userId: application.freelancerId,
            type: 'PROJECT',
            title: 'Offer diterima',
            body: `${req.user.fullName} menerima request Anda untuk ${application.project.title}`,
          },
        }),
        prisma.message.create({
          data: {
            senderId: req.user.id,
            receiverId: application.freelancerId,
            body: `Request Anda untuk "${application.project.title}" diterima. Mari lanjut konfirmasi detail job.`,
          },
        }),
        createProjectHistory(
          application.projectId,
          req.user.id,
          'Request diterima',
          `${application.freelancer.fullName} sekarang mengerjakan ${application.project.title}`,
          'APPLICATION_ACCEPTED'
        ),
      ]);

      res.json({ project: serializeProject(updatedProject) });
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

    if (project.status !== 'IN_PROGRESS') {
      res.status(400);
      throw new Error('Project belum menunggu persetujuan freelancer');
    }

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'CONFIRMED',
          progress: 15,
        },
        include: projectInclude,
      }),
      prisma.notification.create({
        data: {
          userId: project.clientId,
          type: 'PROJECT',
          title: 'Freelancer menyetujui project',
          body: `${req.user.fullName} menyetujui project ${project.title}`,
        },
      }),
    ]);

    res.json({ project: serializeProject(updatedProject) });
  } catch (error) {
    next(error);
  }
};
