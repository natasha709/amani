// Amani School System - Academic Routes
// Classes, subjects, schedules, and academic records

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authMiddleware, authorize, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/v1/academics/classes - Create class
router.post('/classes', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, level, streamId, academicTermId } = req.body;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  const classData = await prisma.class.create({
    data: { name, level: level || 1, streamId, academicTermId, schoolId },
  });

  res.status(201).json({ success: true, data: classData });
}));

// GET /api/v1/academics/classes - List classes
router.get('/classes', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      stream: true,
      subjects: { include: { subject: true } },
      _count: { select: { students: true } },
    },
    orderBy: { level: 'asc' },
  });

  res.json({ success: true, data: classes });
}));

// POST /api/v1/academics/class-subjects - Link subject to class
router.post('/class-subjects', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId, subjectId, teacherId } = req.body;

  const classSubject = await prisma.classSubject.upsert({
    where: {
      classId_subjectId: { classId, subjectId }
    },
    update: { teacherId },
    create: { classId, subjectId, teacherId }
  });

  res.status(201).json({ success: true, data: classSubject });
}));

// DELETE /api/v1/academics/class-subjects/:id - Remove subject from class
router.delete('/class-subjects/:id', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.classSubject.delete({ where: { id } });
  res.json({ success: true, message: 'Subject removed from class' });
}));

// POST /api/v1/academics/subjects - Create subject
router.post('/subjects', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, code, description, academicTermId } = req.body;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  const subject = await prisma.subject.create({
    data: { name, code, description, academicTermId, schoolId },
  });

  res.status(201).json({ success: true, data: subject });
}));

// GET /api/v1/academics/subjects - List subjects
router.get('/subjects', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  const { classId, academicTermId } = req.query;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  const where: any = { schoolId };
  if (academicTermId) where.academicTermId = academicTermId as string;

  const subjects = await prisma.subject.findMany({
    where,
    include: {
      classSubjects: classId ? { where: { classId: classId as string } } : false,
    },
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: subjects });
}));

// POST /api/v1/academics/terms - Create academic term
router.post('/terms', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, startDate, endDate, isCurrent } = req.body;
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  // If setting as current, unset other current terms
  if (isCurrent) {
    await prisma.academicTerm.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const term = await prisma.academicTerm.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: isCurrent || false, schoolId },
  });

  res.status(201).json({ success: true, data: term });
}));

// GET /api/v1/academics/terms - List academic terms
router.get('/terms', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId) {
    res.status(400).json({ success: false, message: 'School not found' });
    return;
  }

  let terms = await prisma.academicTerm.findMany({
    where: { schoolId },
    orderBy: { startDate: 'asc' },
  });

  // Auto-seed default terms if none exist for this school yet
  if (terms.length === 0) {
    const year = new Date().getFullYear();
    await prisma.academicTerm.createMany({
      data: [
        { name: `Term 1 ${year}`, startDate: new Date(`${year}-02-01`), endDate: new Date(`${year}-05-01`), isCurrent: true, schoolId },
        { name: `Term 2 ${year}`, startDate: new Date(`${year}-06-01`), endDate: new Date(`${year}-08-30`), isCurrent: false, schoolId },
        { name: `Term 3 ${year}`, startDate: new Date(`${year}-09-15`), endDate: new Date(`${year}-12-10`), isCurrent: false, schoolId }
      ]
    });

    terms = await prisma.academicTerm.findMany({
      where: { schoolId },
      orderBy: { startDate: 'asc' },
    });
  }

  res.json({ success: true, data: terms });
}));

// POST /api/v1/academics/records - Record academic marks
router.post('/records', authMiddleware, authorize('SCHOOL_OWNER', 'ADMIN', 'TEACHER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, academicTermId, marksObtained, maxMarks, grade } = req.body;

  const record = await prisma.academicRecord.upsert({
    where: {
      studentId_subjectId_academicTermId: {
        studentId,
        subjectId,
        academicTermId,
      },
    },
    create: {
      studentId, subjectId, academicTermId, marksObtained, maxMarks: maxMarks || 100, grade, teacherId: req.user?.id,
    },
    update: {
      marksObtained, maxMarks, grade, teacherId: req.user?.id,
    },
  });

  res.status(201).json({ success: true, data: record });
}));

// GET /api/v1/academics/records - Get academic records
router.get('/records', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, classId, academicTermId } = req.query;

  const where: any = {};
  if (studentId) where.studentId = studentId as string;
  if (academicTermId) where.academicTermId = academicTermId as string;

  const records = await prisma.academicRecord.findMany({
    where,
    include: {
      student: { select: { firstName: true, lastName: true, studentNo: true, class: true } },
      subject: true,
      academicTerm: true,
    },
    orderBy: [{ academicTerm: { startDate: 'desc' } }, { subject: { name: 'asc' } }],
  });

  res.json({ success: true, data: records });
}));

export default router;
