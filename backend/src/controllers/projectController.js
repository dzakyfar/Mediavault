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
  _count: { select: { files: true } },
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
      ]);

      res.json({ project: serializeProject(updatedProject) });
      return;
    }

    await prisma.$transaction([
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
    ]);

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
