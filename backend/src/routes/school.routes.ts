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

// GET /api/v1/schools - List all schools
router.get('/', authMiddleware, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
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

// DELETE /api/v1/schools/:id - Delete school
router.delete('/:id', authMiddleware, authorize('SUPER_ADMIN', 'SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id },
  });
  
  if (!school) {
    res.status(404).json({
      success: false,
      message: 'School not found',
    });
    return;
  }
  
  // Delete in proper order to handle foreign key constraints
  // First, get all related IDs
  const [students, classes, streams, academicTerms, feeStructures, users, saccoMembers, announcements, messages] = await Promise.all([
    prisma.student.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.class.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.stream.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.academicTerm.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.feeStructure.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.user.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.saccoMember.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.announcement.findMany({ where: { schoolId: id }, select: { id: true } }),
    prisma.message.findMany({ where: { schoolId: id }, select: { id: true } }),
  ]);
  
  const studentIds = students.map(s => s.id);
  const classIds = classes.map(c => c.id);
  const streamIds = streams.map(s => s.id);
  const academicTermIds = academicTerms.map(t => t.id);
  const feeStructureIds = feeStructures.map(f => f.id);
  const userIds = users.map(u => u.id);
  const saccoMemberIds = saccoMembers.map(m => m.id);
  
  // Delete in order of dependencies
  // 1. Delete class schedules
  if (classIds.length > 0) {
    await prisma.classSchedule.deleteMany({ where: { classId: { in: classIds } } });
  }
  
  // 2. Delete class teachers
  if (classIds.length > 0) {
    await prisma.classTeacher.deleteMany({ where: { classId: { in: classIds } } });
  }
  
  // 3. Delete class subjects
  if (classIds.length > 0) {
    await prisma.classSubject.deleteMany({ where: { classId: { in: classIds } } });
  }
  
  // 4. Delete academic records
  if (studentIds.length > 0) {
    await prisma.academicRecord.deleteMany({ where: { studentId: { in: studentIds } } });
  }
  
  // 5. Delete payments
  if (studentIds.length > 0) {
    await prisma.payment.deleteMany({ where: { studentId: { in: studentIds } } });
  }
  
  // 6. Delete fee balances
  if (studentIds.length > 0 && feeStructureIds.length > 0) {
    await prisma.feeBalance.deleteMany({ 
      where: { 
        studentId: { in: studentIds },
        feeStructureId: { in: feeStructureIds },
      } 
    });
  }
  
  // 7. Delete SACCO transactions
  if (saccoMemberIds.length > 0) {
    await prisma.saccoTransaction.deleteMany({ where: { memberId: { in: saccoMemberIds } } });
  }
  
  // 8. Delete SACCO members
  await prisma.saccoMember.deleteMany({ where: { schoolId: id } });
  
  // 9. Delete announcements
  await prisma.announcement.deleteMany({ where: { schoolId: id } });
  
  // 10. Delete messages
  await prisma.message.deleteMany({ where: { schoolId: id } });
  
  // 11. Delete students
  await prisma.student.deleteMany({ where: { schoolId: id } });
  
  // 12. Delete classes
  await prisma.class.deleteMany({ where: { schoolId: id } });
  
  // 13. Delete subjects
  await prisma.subject.deleteMany({ where: { schoolId: id } });
  
  // 14. Delete streams
  await prisma.stream.deleteMany({ where: { schoolId: id } });
  
  // 15. Delete fee structures
  await prisma.feeStructure.deleteMany({ where: { schoolId: id } });
  
  // 16. Delete academic terms
  await prisma.academicTerm.deleteMany({ where: { schoolId: id } });
  
  // 17. Delete users (except the current user to avoid auth issues)
  await prisma.user.deleteMany({ 
    where: { 
      schoolId: id,
      id: { not: req.user?.id },
    } 
  });
  
  // 18. Finally delete the school
  await prisma.school.delete({
    where: { id },
  });
  
  res.json({
    success: true,
    message: 'School deleted successfully',
  });
}));

export default router;
