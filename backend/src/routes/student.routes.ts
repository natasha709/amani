// Amani School System - Student Routes
// Student management and admissions

import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
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
  classId: z.string().optional(),
  streamId: z.string().optional(),
  parentId: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
});

const updateStudentSchema = createStudentSchema.partial();

// POST /api/v1/students - Create new student (admission)
router.post('/', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN', 'TEACHER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createStudentSchema.parse(req.body);
  let schoolId = req.user?.schoolId;
  
  // If no schoolId, create a default school for the user
  if (!schoolId) {
    const newSchool = await prisma.school.create({
      data: {
        name: 'My School',
        currency: 'UGX',
        timezone: 'Africa/Kampala',
      },
    });
    
    await prisma.user.update({
      where: { id: req.user?.id },
      data: { schoolId: newSchool.id },
    });
    
    schoolId = newSchool.id;
  }
  
  // Generate student number
  const count = await prisma.student.count({ where: { schoolId } });
  const studentNo = `STU-${String(count + 1).padStart(5, '0')}`;
  
  // Handle parent - create new user with PARENT role if parent details provided
  let parentId = data.parentId;
  if (!parentId && data.parentFirstName && data.parentLastName) {
    try {
      const hashedPassword = await bcrypt.hash('parent123', 12);
      const parent = await prisma.user.create({
        data: {
          email: `parent_${Date.now()}@amanischool.com`,
          password: hashedPassword,
          firstName: data.parentFirstName,
          lastName: data.parentLastName,
          phone: data.phone || '',
          schoolId,
          role: 'PARENT',
        },
      });
      parentId = parent.id;
    } catch (error) {
      console.error('Failed to create parent:', error);
    }
  }
  
  const student = await prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      placeOfBirth: data.placeOfBirth,
      address: data.address,
      phone: data.phone,
      classId: data.classId || null,
      streamId: data.streamId || null,
      parentId: parentId || null,
      studentNo,
      schoolId,
      createdById: req.user?.id,
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
  
  // If no schoolId, return empty array for demo purposes
  if (!schoolId) {
    res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
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

// DELETE /api/v1/students/:id - Delete student permanently
router.delete('/:id', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Permanently delete the student
  await prisma.student.delete({
    where: { id },
  });
  
  res.json({ success: true, message: 'Student deleted permanently' });
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
