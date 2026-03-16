// Amani School System - Student Routes
// Student management and admissions

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Validation schemas
const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  classId: z.string().uuid().optional(),
  streamId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

const updateStudentSchema = createStudentSchema.partial();

// POST /api/v1/students - Create new student (admission)
router.post('/', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN', 'TEACHER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createStudentSchema.parse(req.body);
  const schoolId = req.user?.schoolId;
  
  if (!schoolId) {
    res.status(400).json({
      success: false,
      message: 'School not found',
    });
    return;
  }
  
  // Generate student number
  const count = await prisma.student.count({ where: { schoolId } });
  const studentNo = `STU-${String(count + 1).padStart(5, '0')}`;
  
  const student = await prisma.student.create({
    data: {
      ...data,
      studentNo,
      schoolId,
      createdById: req.user?.id,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
    include: {
      class: true,
      parent: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
  });
  
  res.status(201).json({
    success: true,
    data: student,
  });
}));

// GET /api/v1/students - List students
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { classId, status, search, page = '1', limit = '20' } = req.query;
  
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }
  
  const where: any = { schoolId };
  
  if (classId) where.classId = classId as string;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { studentNo: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        class: true,
        stream: true,
        parent: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: students,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
}));

// GET /api/v1/students/:id - Get student details
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      stream: true,
      parent: true,
      payments: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      academicRecords: {
        include: {
          subject: true,
          academicTerm: true,
        },
      },
    },
  });
  
  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }
  
  res.json({ success: true, data: student });
}));

// PUT /api/v1/students/:id - Update student
router.put('/:id', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateStudentSchema.parse(req.body);
  
  const student = await prisma.student.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
    include: {
      class: true,
      parent: true,
    },
  });
  
  res.json({ success: true, data: student });
}));

// DELETE /api/v1/students/:id - Delete student
router.delete('/:id', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Soft delete - mark as inactive
  await prisma.student.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });
  
  res.json({ success: true, message: 'Student deactivated' });
}));

// GET /api/v1/students/:id/fees - Get student fee balance
router.get('/:id/fees', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const feeBalances = await prisma.feeBalance.findMany({
    where: { studentId: id },
    include: {
      feeStructure: {
        include: { academicTerm: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const totalDue = feeBalances.reduce((sum, fb) => sum + fb.balance, 0);
  
  res.json({
    success: true,
    data: {
      feeBalances,
      totalDue,
    },
  });
}));

export default router;
