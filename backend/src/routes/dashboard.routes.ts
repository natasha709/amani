// Amani School System - Dashboard Routes
// Real-time dashboards for school owners and administrators

import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// GET /api/v1/dashboard/summary - Dashboard summary
router.get('/summary', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    // Return empty data for demo
    res.json({
      success: true,
      data: {
        totalStudents: 0,
        activeStudents: 0,
        totalStaff: 0,
        totalClasses: 0,
        currentTerm: 'Not set',
      },
    });
    return;
  }
  
  const [
    totalStudents,
    activeStudents,
    totalStaff,
    totalClasses,
    currentTerm,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.user.count({ where: { schoolId, role: { in: ['TEACHER', 'ADMIN'] } } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.academicTerm.findFirst({ where: { schoolId, isCurrent: true } }),
  ]);
  
  res.json({
    success: true,
    data: {
      totalStudents,
      activeStudents,
      totalStaff,
      totalClasses,
      currentTerm: currentTerm?.name || 'Not set',
    },
  });
}));

// GET /api/v1/dashboard/finances - Financial overview
router.get('/finances', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { period = 'month' } = req.query;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  // Calculate date range
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'term':
      const term = await prisma.academicTerm.findFirst({ where: { schoolId, isCurrent: true } });
      startDate = term?.startDate || new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const [paymentsSummary, feeBalances, recentPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        schoolId,
        status: 'COMPLETED',
        paymentDate: { gte: startDate },
      },
      _sum: { amount: true, transactionFee: true },
      _count: true,
    }),
    prisma.feeBalance.aggregate({
      where: { student: { schoolId } },
      _sum: { amount: true, paidAmount: true, balance: true },
    }),
    prisma.payment.findMany({
      where: { schoolId, status: 'COMPLETED' },
      take: 10,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true, studentNo: true } },
      },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      collected: paymentsSummary._sum.amount || 0,
      transactionFees: paymentsSummary._sum.transactionFee || 0,
      totalTransactions: paymentsSummary._count,
      expectedRevenue: feeBalances._sum.amount || 0,
      receivedRevenue: feeBalances._sum.paidAmount || 0,
      outstandingBalance: feeBalances._sum.balance || 0,
      recentPayments,
    },
  });
}));

// GET /api/v1/dashboard/academics - Academic overview
router.get('/academics', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const currentTerm = await prisma.academicTerm.findFirst({
    where: { schoolId, isCurrent: true },
  });
  
  const classStats = await prisma.class.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: {
          students: { where: { status: 'ACTIVE' } },
        },
      },
    },
  });
  
  const subjectCount = await prisma.subject.count({ where: { schoolId } });
  
  res.json({
    success: true,
    data: {
      currentTerm: currentTerm?.name || 'Not set',
      totalClasses: classStats.length,
      totalSubjects: subjectCount,
      classEnrollment: classStats.map(c => ({
        className: c.name,
        enrollment: c._count.students,
      })),
    },
  });
}));

// GET /api/v1/dashboard/sacco - Sacco overview
router.get('/sacco', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const [memberStats, loanStats, recentTransactions] = await Promise.all([
    prisma.saccoMember.aggregate({
      where: { schoolId, status: 'ACTIVE' },
      _sum: { totalSavings: true },
      _count: true,
    }),
    prisma.loanApplication.aggregate({
      where: { member: { schoolId }, status: { in: ['APPROVED', 'DISBURSED'] } },
      _sum: { amount: true },
    }),
    prisma.saccoTransaction.findMany({
      where: { schoolId },
      take: 10,
      orderBy: { transactionDate: 'desc' },
      include: {
        member: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      totalMembers: memberStats._count,
      totalSavings: memberStats._sum.totalSavings || 0,
      totalLoansDisbursed: loanStats._sum.amount || 0,
      recentTransactions,
    },
  });
}));

// GET /api/v1/dashboard/activity - Recent activity
router.get('/activity', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const [recentPayments, recentStudents, announcements] = await Promise.all([
    prisma.payment.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { firstName: true, lastName: true } } },
    }),
    prisma.student.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { firstName: true, lastName: true, studentNo: true, createdAt: true },
    }),
    prisma.announcement.findMany({
      where: { schoolId, isPublished: true },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: { title: true, type: true, publishedAt: true },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      recentPayments,
      recentStudents,
      announcements,
    },
  });
}));

export default router;
