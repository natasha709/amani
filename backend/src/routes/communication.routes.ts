// Amani School System - Communication Routes
// Announcements and messaging

import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/v1/communications/announcements - Create announcement
router.post('/announcements', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, content, type, priority, scope, classId } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const announcement = await prisma.announcement.create({
    data: {
      title, content, type: type || 'GENERAL', priority: priority || 'NORMAL',
      scope: scope || 'ALL', classId, authorId: req.user?.id!, schoolId, isPublished: true, publishedAt: new Date(),
    },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  
  res.status(201).json({ success: true, data: announcement });
}));

// GET /api/v1/communications/announcements - List announcements
router.get('/announcements', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { type, scope, published } = req.query;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const where: any = { schoolId };
  if (type) where.type = type;
  if (scope) where.scope = scope;
  if (published !== undefined) where.isPublished = published === 'true';
  
  const announcements = await prisma.announcement.findMany({
    where,
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });
  
  res.json({ success: true, data: announcements });
}));

// POST /api/v1/communications/messages - Send message
router.post('/messages', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subject, body, type, recipients, channel } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const message = await prisma.message.create({
    data: {
      subject, body, type: type || 'INDIVIDUAL', channel: channel || 'IN_APP',
      senderId: req.user?.id!, schoolId,
    },
  });
  
  // Create recipients
  if (recipients?.length > 0) {
    await prisma.messageRecipient.createMany({
      data: recipients.map((r: string) => ({
        messageId: message.id,
        recipientId: r,
        recipientEmail: r, // Would need to resolve email from ID
        channel: channel || 'IN_APP',
      })),
    });
  }
  
  res.status(201).json({ success: true, data: message });
}));

// GET /api/v1/communications/messages - List messages
router.get('/messages', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  const messages = await prisma.message.findMany({
    where: {
      recipients: { some: { recipientId: userId } },
    },
    include: {
      sender: { select: { firstName: true, lastName: true } },
      recipients: true,
    },
    orderBy: { sentAt: 'desc' },
    take: 50,
  });
  
  res.json({ success: true, data: messages });
}));

// GET /api/v1/communications/messages/:id - Get message details
router.get('/messages/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  const message = await prisma.message.findFirst({
    where: { id, recipients: { some: { recipientId: userId } } },
    include: {
      sender: { select: { firstName: true, lastName: true, email: true } },
      recipients: true,
    },
  });
  
  if (!message) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }
  
  // Mark as read
  await prisma.messageRecipient.updateMany({
    where: { messageId: id, recipientId: userId },
    data: { isRead: true, readAt: new Date() },
  });
  
  res.json({ success: true, data: message });
}));

export default router;
