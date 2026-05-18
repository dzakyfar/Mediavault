const prisma = require('../config/prisma');
const { shortName } = require('../utils/formatters');

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

    res.json({
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        isMine: message.senderId === req.user.id,
        sender: shortName(message.sender.fullName),
        receiver: shortName(message.receiver.fullName),
      })),
    });
  } catch (error) {
    next(error);
  }
};
