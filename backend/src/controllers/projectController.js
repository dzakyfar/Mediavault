const prisma = require('../config/prisma');
const { serializeProject } = require('../utils/formatters');

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
    include: { freelancer: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  },
  _count: { select: { files: true } },
};

const createProjectHistory = (projectId, actorId, title, body, eventType) =>
  prisma.projectHistory.create({
    data: { projectId, actorId, title, body, eventType },
  });

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

exports.listOpenProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: 'OPEN',
        applications: {
          none: {
            freelancerId: req.user.id,
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
        },
      },
      include: {
        client: { select: { fullName: true } },
        freelancer: { select: { fullName: true } },
        applications: {
          where: { status: 'PENDING' },
          include: { freelancer: { select: { fullName: true } } },
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

    const application = await prisma.projectApplication.create({
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
        'Request job masuk',
        `${req.user.fullName} mengirim request untuk ${project.title}`,
        'APPLICATION_CREATED'
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

    if (action === 'accept') {
      const [, updatedProject] = await prisma.$transaction([
        prisma.projectApplication.update({
          where: { id: applicationId },
          data: { status: 'ACCEPTED' },
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
