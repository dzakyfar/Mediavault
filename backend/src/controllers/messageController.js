const prisma = require('../config/prisma');
const { shortName } = require('../utils/formatters');
const { validateInlineImage } = require('../utils/uploadLimits');
const { resolveMessageMedia } = require('../utils/mediaUrls');
const { notifyUser } = require('../services/notificationService');

const serializeMessage = (message, currentUserId) => ({
  id: message.id,
  body: message.body,
  imageUrl: message.imageUrl,
  imageName: message.imageName,
  imageMime: message.imageMime,
  imageSize: message.imageSize,
  createdAt: message.createdAt,
  read: Boolean(message.readAt),
  isMine: message.senderId === currentUserId,
  senderId: message.senderId,
  receiverId: message.receiverId,
  sender: shortName(message.sender.fullName),
  receiver: shortName(message.receiver.fullName),
  peerId: message.senderId === currentUserId ? message.receiverId : message.senderId,
  peerName: message.senderId === currentUserId
    ? shortName(message.receiver.fullName)
    : shortName(message.sender.fullName),
});

const serializeMessageWithMedia = async (message, currentUserId) =>
  resolveMessageMedia(serializeMessage(message, currentUserId));

exports.listMessages = async (req, res, next) => {
  try {
    const messageWhere = {
      OR: [
        { senderId: req.user.id },
        { receiverId: req.user.id },
      ],
    };

    const [messages, conversationMessages, applications] = await Promise.all([
      prisma.message.findMany({
        where: messageWhere,
        include: {
          sender: { select: { id: true, fullName: true } },
          receiver: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.message.findMany({
        where: messageWhere,
        include: {
          sender: { select: { id: true, fullName: true } },
          receiver: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.projectApplication.findMany({
        where: {
          status: { in: ['PENDING', 'ACCEPTED'] },
          OR: [
            { freelancerId: req.user.id },
            { project: { clientId: req.user.id } },
          ],
        },
        include: {
          freelancer: { select: { id: true, fullName: true } },
          project: {
            select: {
              id: true,
              title: true,
              clientId: true,
              client: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const serializedMessages = (await Promise.all(
      messages.map((message) => serializeMessageWithMedia(message, req.user.id))
    )).reverse();

    const conversationMap = new Map();
    conversationMessages.forEach((message) => {
      const serialized = serializeMessage(message, req.user.id);
      const current = conversationMap.get(serialized.peerId);
      if (!current) {
        conversationMap.set(serialized.peerId, {
          peerId: serialized.peerId,
          peerName: serialized.peerName,
          lastMessage: serialized.body,
          lastMessageAt: serialized.createdAt,
          unreadCount: serialized.isMine || serialized.read ? 0 : 1,
        });
        return;
      }

      if (!serialized.isMine && !serialized.read) {
        current.unreadCount += 1;
      }
    });

    applications.forEach((application) => {
      const isClient = application.project.clientId === req.user.id;
      const peer = isClient ? application.freelancer : application.project.client;

      if (!peer || conversationMap.has(peer.id)) {
        return;
      }

      conversationMap.set(peer.id, {
        peerId: peer.id,
        peerName: shortName(peer.fullName),
        lastMessage: application.message || `Request job: ${application.project.title}`,
        lastMessageAt: application.createdAt,
        unreadCount: 0,
      });
    });

    res.json({
      messages: serializedMessages,
      conversations: Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ),
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadMessageCount = async (req, res, next) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: req.user.id,
        readAt: null,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, body = '', imageUrl, imageName, imageMime, imageSize } = req.body;

    if (!receiverId || (!body?.trim() && !imageUrl)) {
      res.status(400);
      throw new Error('Penerima dan isi pesan atau gambar wajib diisi');
    }

    if (receiverId === req.user.id) {
      res.status(400);
      throw new Error('Tidak bisa mengirim pesan ke diri sendiri');
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, fullName: true, role: true, isAvailable: true },
    });

    if (!receiver) {
      res.status(404);
      throw new Error('Penerima pesan tidak ditemukan');
    }

    const receiverIsFreelancer = ['FREELANCER', 'BOTH'].includes(receiver.role);
    if (receiverIsFreelancer && !receiver.isAvailable) {
      const activeProject = await prisma.project.findFirst({
        where: {
          clientId: req.user.id,
          freelancerId: receiver.id,
          status: { notIn: ['COMPLETED', 'AUTO_COMPLETED', 'CANCELLED'] },
        },
        select: { id: true },
      });

      if (!activeProject) {
        res.status(403);
        throw new Error('Freelancer sedang sibuk dan belum menerima pesan baru');
      }
    }

    const imageError = validateInlineImage({ imageUrl, imageMime, imageSize });
    if (imageError) {
      res.status(400);
      throw new Error(imageError);
    }

    const cleanBody = body.trim() || (imageUrl ? 'Mengirim gambar' : '');
    const receiverMessagePath =
      receiver.role === 'FREELANCER' || (receiver.role === 'BOTH' && ['CLIENT', 'BOTH'].includes(req.user.role))
        ? '/dashboard/freelancer/messages'
        : '/dashboard/client/messages';

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        body: cleanBody,
        imageUrl: imageUrl || null,
        imageName: imageName || null,
        imageMime: imageMime || null,
        imageSize: Number.isFinite(Number(imageSize)) ? Number(imageSize) : null,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } },
      },
    });

    await notifyUser({
      userId: receiverId,
      type: 'MESSAGE',
      title: 'Pesan baru',
      body: `${req.user.fullName}: ${cleanBody.slice(0, 120)}`,
      telegramTitle: 'Pesan baru',
      telegramBody: 'You have 1 new message.',
      actionPath: receiverMessagePath,
    }).catch(() => undefined);

    res.status(201).json({ message: await serializeMessageWithMedia(message, req.user.id) });
  } catch (error) {
    next(error);
  }
};

exports.markMessagesRead = async (req, res, next) => {
  try {
    const { peerId } = req.body;

    await prisma.message.updateMany({
      where: {
        receiverId: req.user.id,
        senderId: peerId || undefined,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        type: 'MESSAGE',
        readAt: null,
      },
      data: { readAt: new Date() },
    }).catch(() => undefined);

    res.json({ message: 'Pesan ditandai sudah dibaca' });
  } catch (error) {
    next(error);
  }
};
