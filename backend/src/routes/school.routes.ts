// Amani School System - School Routes
// School CRUD operations

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Validation schema
const createSchoolSchema = z.object({
  name: z.string().min(1),
  registrationNo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

// POST /api/v1/schools - Create a new school
router.post('/', authMiddleware, authorize('SUPER_ADMIN', 'SCHOOL_OWNER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createSchoolSchema.parse(req.body);
  
  const school = await prisma.school.create({
    data: {
      ...data,
      subscriptionPlan: 'FREE_TRIAL',
      subscriptionStart: new Date(),
    },
  });
  
  // If school owner, link user to school
  if (req.user?.role === 'SCHOOL_OWNER') {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { schoolId: school.id },
    });
  }
  
  res.status(201).json({
    success: true,
    data: school,
  });
}));

// GET /api/v1/schools - List all schools (admin only)
router.get('/', authMiddleware, authorize('SUPER_ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: {
          users: true,
          students: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  res.json({
    success: true,
    data: schools,
  });
}));

// GET /api/v1/schools/:id - Get school details
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      _count: {
        select: {
          students: true,
          classes: true,
        },
      },
    },
  });
  
  if (!school) {
    res.status(404).json({
      success: false,
      message: 'School not found',
    });
    return;
  }
  
  res.json({
    success: true,
    data: school,
  });
}));

// PUT /api/v1/schools/:id - Update school
router.put('/:id', authMiddleware, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = createSchoolSchema.partial().parse(req.body);
  
  const school = await prisma.school.update({
    where: { id },
    data,
  });
  
  res.json({
    success: true,
    data: school,
  });
}));

// GET /api/v1/schools/:id/stats - Get school statistics
router.get('/:id/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const [
    totalStudents,
    totalStaff,
    totalRevenue,
    recentPayments,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId: id, status: 'ACTIVE' } }),
    prisma.user.count({ where: { schoolId: id, role: { in: ['TEACHER', 'ADMIN'] } } }),
    prisma.payment.aggregate({
      where: { schoolId: id, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { schoolId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { firstName: true, lastName: true, studentNo: true },
        },
      },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      totalStudents,
      totalStaff,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentPayments,
    },
  });
}));

export default router;
