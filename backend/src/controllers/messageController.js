const prisma = require('../config/prisma');
const { shortName } = require('../utils/formatters');

const serializeMessage = (message, currentUserId) => ({
  id: message.id,
  body: message.body,
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

exports.listMessages = async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const serializedMessages = messages
      .map((message) => serializeMessage(message, req.user.id))
      .reverse();

    const conversationMap = new Map();
    messages.forEach((message) => {
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

    res.json({
      messages: serializedMessages,
      conversations: Array.from(conversationMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, body } = req.body;

    if (!receiverId || !body?.trim()) {
      res.status(400);
      throw new Error('Penerima dan isi pesan wajib diisi');
    }

    if (receiverId === req.user.id) {
      res.status(400);
      throw new Error('Tidak bisa mengirim pesan ke diri sendiri');
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, fullName: true },
    });

    if (!receiver) {
      res.status(404);
      throw new Error('Penerima pesan tidak ditemukan');
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId,
          body: body.trim(),
        },
        include: {
          sender: { select: { id: true, fullName: true } },
          receiver: { select: { id: true, fullName: true } },
        },
      }),
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'MESSAGE',
          title: 'Pesan baru',
          body: `${req.user.fullName}: ${body.trim().slice(0, 120)}`,
        },
      }),
    ]);

    res.status(201).json({ message: serializeMessage(message, req.user.id) });
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

    res.json({ message: 'Pesan ditandai sudah dibaca' });
  } catch (error) {
    next(error);
  }
};
