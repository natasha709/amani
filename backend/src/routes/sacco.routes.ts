// Amani School System - Sacco Routes
// School savings and loans management

import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/v1/sacco/members - Register sacco member
router.post('/members', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, memberType } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const count = await prisma.saccoMember.count({ where: { schoolId } });
  const memberNo = `SAC-${String(count + 1).padStart(5, '0')}`;
  
  const member = await prisma.saccoMember.create({
    data: { memberNo, userId, schoolId, memberType: memberType || 'TEACHER' },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  
  res.status(201).json({ success: true, data: member });
}));

// GET /api/v1/sacco/members - List sacco members
router.get('/members', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { status, memberType } = req.query;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const where: any = { schoolId };
  if (status) where.status = status;
  if (memberType) where.memberType = memberType;
  
  const members = await prisma.saccoMember.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    orderBy: { joinedAt: 'desc' },
  });
  
  const summary = await prisma.saccoMember.aggregate({
    where: { schoolId, status: 'ACTIVE' },
    _sum: { totalSavings: true, totalLoans: true, outstandingLoan: true },
    _count: true,
  });
  
  res.json({
    success: true,
    data: members,
    summary: {
      totalMembers: summary._count,
      totalSavings: summary._sum.totalSavings || 0,
      totalLoansDisbursed: summary._sum.totalLoans || 0,
      outstandingLoans: summary._sum.outstandingLoan || 0,
    },
  });
}));

// GET /api/v1/sacco/members/:id - Get member details
router.get('/members/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const member = await prisma.saccoMember.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      transactions: { orderBy: { transactionDate: 'desc' }, take: 20 },
      loanApplications: { orderBy: { appliedAt: 'desc' } },
    },
  });
  
  if (!member) {
    res.status(404).json({ success: false, message: 'Member not found' });
    return;
  }
  
  res.json({ success: true, data: member });
}));

// POST /api/v1/sacco/transactions - Create sacco transaction
router.post('/transactions', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { memberId, type, amount, description, reference } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const member = await prisma.saccoMember.findUnique({ where: { id: memberId } });
  if (!member) {
    res.status(404).json({ success: false, message: 'Member not found' });
    return;
  }
  
  // Calculate balance after
  let balanceAfter = member.totalSavings;
  if (type === 'DEPOSIT') {
    balanceAfter += amount;
  } else if (type === 'WITHDRAWAL') {
    if (balanceAfter < amount) {
      res.status(400).json({ success: false, message: 'Insufficient balance' });
      return;
    }
    balanceAfter -= amount;
  }
  
  const count = await prisma.saccoTransaction.count({ where: { schoolId } });
  const transactionNo = `TXN-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  
  const transaction = await prisma.$transaction(async (tx) => {
    const txRecord = await tx.saccoTransaction.create({
      data: { transactionNo, type, amount, balanceAfter, description, reference, memberId, schoolId },
    });
    
    await tx.saccoMember.update({
      where: { id: memberId },
      data: { totalSavings: balanceAfter },
    });
    
    return txRecord;
  });
  
  res.status(201).json({ success: true, data: transaction });
}));

// POST /api/v1/sacco/loans - Apply for loan
router.post('/loans', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { memberId, amount, purpose, durationMonths } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const member = await prisma.saccoMember.findUnique({ where: { id: memberId } });
  if (!member || member.status !== 'ACTIVE') {
    res.status(400).json({ success: false, message: 'Invalid member' });
    return;
  }
  
  // Check if member has outstanding loans
  if (member.outstandingLoan > 0) {
    res.status(400).json({ success: false, message: 'Member has outstanding loan' });
    return;
  }
  
  // Simple interest calculation (10% per annum)
  const interestRate = 0.10;
  const interest = (amount * interestRate * durationMonths) / 12;
  const totalRepayment = amount + interest;
  const monthlyRepayment = totalRepayment / durationMonths;
  
  const count = await prisma.loanApplication.count({ where: { member: { schoolId } } });
  const applicationNo = `LN-${String(count + 1).padStart(6, '0')}`;
  
  const application = await prisma.loanApplication.create({
    data: {
      applicationNo, memberId, amount, purpose, durationMonths,
      status: 'PENDING', monthlyRepayment,
    },
  });
  
  res.status(201).json({ success: true, data: application });
}));

// POST /api/v1/sacco/loans/:id/approve - Approve loan
router.post('/loans/:id/approve', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: { member: true },
  });
  
  if (!application || application.status !== 'PENDING') {
    res.status(400).json({ success: false, message: 'Invalid application' });
    return;
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.loanApplication.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: req.user?.id, approvalDate: new Date() },
    });
    
    await tx.saccoMember.update({
      where: { id: application.memberId },
      data: {
        totalLoans: { increment: application.amount },
        outstandingLoan: { increment: application.amount },
      },
    });
    
    // Create loan disbursement transaction
    await tx.saccoTransaction.create({
      data: {
        transactionNo: `TXN-DISB-${Date.now()}`,
        type: 'LOAN_DISBURSEMENT',
        amount: application.amount,
        balanceAfter: application.member.totalSavings,
        description: `Loan disbursement - ${application.applicationNo}`,
        memberId: application.memberId,
        schoolId: application.member.schoolId,
      },
    });
    
    return app;
  });
  
  res.json({ success: true, data: updated });
}));

export default router;
