// Amani School System - Payment Routes
// Fee payments and transactions

import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Validation schema
const createPaymentSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER']),
  paymentChannel: z.string().optional(),
  transactionRef: z.string().optional(),
  phoneNumber: z.string().optional(),
  paidByName: z.string().optional(),
  paidByPhone: z.string().optional(),
  // Transform empty string to undefined so Prisma ignores it
  feeStructureId: z.string().uuid().or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  notes: z.string().optional(),
});

// POST /api/v1/payments - Create payment
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createPaymentSchema.parse(req.body);
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  // Calculate transaction fee (2% as per business plan)
  const transactionFee = data.amount * 0.02;
  const totalAmount = data.amount + transactionFee;

  // Generate receipt number
  const count = await prisma.payment.count({ where: { schoolId } });
  const receiptNo = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

  // Create payment in transaction
  const payment = await prisma.$transaction(async (tx) => {
    // Create payment record
    const newPayment = await tx.payment.create({
      data: {
        receiptNo,
        amount: data.amount,
        transactionFee,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentChannel: data.paymentChannel,
        transactionRef: data.transactionRef,
        phoneNumber: data.phoneNumber,
        paidByName: data.paidByName,
        paidByPhone: data.paidByPhone,
        status: 'COMPLETED',
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        schoolId,
        notes: data.notes,
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, studentNo: true },
        },
      },
    });

    // Update fee balance if fee structure specified
    if (data.feeStructureId) {
      const feeBalance = await tx.feeBalance.findUnique({
        where: {
          studentId_feeStructureId: {
            studentId: data.studentId,
            feeStructureId: data.feeStructureId,
          },
        },
      });

      if (feeBalance) {
        const newPaidAmount = feeBalance.paidAmount + data.amount;
        const newBalance = Math.max(0, feeBalance.amount - newPaidAmount);

        await tx.feeBalance.update({
          where: { id: feeBalance.id },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
          },
        });

        await tx.payment.update({
          where: { id: newPayment.id },
          data: { feeBalanceId: feeBalance.id },
        });
      }
    }

    return newPayment;
  });

  res.status(201).json({
    success: true,
    data: payment,
  });
}));

// GET /api/v1/payments - List payments
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { studentId, status, startDate, endDate, page = '1', limit = '20' } = req.query;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  const where: any = { schoolId };

  if (studentId) where.studentId = studentId as string;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate as string);
    if (endDate) where.paymentDate.lte = new Date(endDate as string);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, studentNo: true, class: true },
        },
        feeBalance: true,
        feeStructure: true,
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  const summary = await prisma.payment.aggregate({
    where: { ...where, status: 'COMPLETED' },
    _sum: { amount: true, transactionFee: true },
    _count: true,
  });

  res.json({
    success: true,
    data: payments,
    summary: {
      totalAmount: summary._sum.amount || 0,
      totalFees: summary._sum.transactionFee || 0,
      totalTransactions: summary._count,
    },
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
}));

// GET /api/v1/payments/:id - Get payment details
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      student: {
        select: { firstName: true, lastName: true, studentNo: true, class: true },
      },
      feeStructure: true,
    },
  });

  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment not found' });
    return;
  }

  res.json({ success: true, data: payment });
}));

// POST /api/v1/payments/:id/refund - Refund payment
router.post('/:id/refund', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const payment = await prisma.payment.update({
    where: { id },
    data: { status: 'REFUNDED' },
  });

  res.json({ success: true, data: payment });
}));

export default router;
