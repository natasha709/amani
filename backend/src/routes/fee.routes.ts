// Amani School System - Fee Structure Routes

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

const createFeeStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  academicTermId: z.string().uuid().optional(),
  isOptional: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
});

// POST /api/v1/fees - Create fee structure
router.post('/', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createFeeStructureSchema.parse(req.body);
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const feeStructure = await prisma.feeStructure.create({
    data: {
      ...data,
      schoolId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      academicTermId: data.academicTermId,
    },
  });
  
  res.status(201).json({ success: true, data: feeStructure });
}));

// GET /api/v1/fees - List fee structures
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { academicTermId } = req.query;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const where: any = { schoolId };
  if (academicTermId) where.academicTermId = academicTermId as string;
  
  const feeStructures = await prisma.feeStructure.findMany({
    where,
    include: {
      academicTerm: true,
      _count: { select: { feeBalances: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ success: true, data: feeStructures });
}));

// POST /api/v1/fees/:id/assign - Assign fee to students
router.post('/:id/assign', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { classId, studentIds } = req.body;
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const feeStructure = await prisma.feeStructure.findUnique({ where: { id } });
  if (!feeStructure) {
    res.status(404).json({ success: false, message: 'Fee structure not found' });
    return;
  }
  
  // Get students to assign
  let students;
  if (studentIds?.length > 0) {
    students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId },
    });
  } else if (classId) {
    students = await prisma.student.findMany({
      where: { classId, schoolId, status: 'ACTIVE' },
    });
  } else {
    students = await prisma.student.findMany({
      where: { schoolId, status: 'ACTIVE' },
    });
  }
  
  // Create fee balances
  const feeBalances = await prisma.feeBalance.createMany({
    data: students.map(s => ({
      studentId: s.id,
      feeStructureId: id,
      amount: feeStructure.amount,
      paidAmount: 0,
      balance: feeStructure.amount,
    })),
    skipDuplicates: true,
  });
  
  res.status(201).json({ 
    success: true, 
    message: `Assigned fee to ${feeBalances.count} students`,
  });
}));

// GET /api/v1/fees/:id/collections - Get fee collection report
router.get('/:id/collections', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id },
    include: {
      feeBalances: {
        include: {
          student: {
            select: { firstName: true, lastName: true, studentNo: true, class: true },
          },
        },
      },
    },
  });
  
  if (!feeStructure) {
    res.status(404).json({ success: false, message: 'Fee structure not found' });
    return;
  }
  
  const totalExpected = feeStructure.amount * feeStructure.feeBalances.length;
  const totalCollected = feeStructure.feeBalances.reduce((sum, fb) => sum + fb.paidAmount, 0);
  const totalBalance = feeStructure.feeBalances.reduce((sum, fb) => sum + fb.balance, 0);
  
  res.json({
    success: true,
    data: {
      feeStructure,
      summary: {
        totalExpected,
        totalCollected,
        totalBalance,
        collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
      },
    },
  });
}));

export default router;
