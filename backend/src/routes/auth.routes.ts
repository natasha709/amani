// Amani School System - Authentication Routes
// Login, register, password reset

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['SCHOOL_OWNER', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'ALUMNI']).optional(),
  schoolId: z.string().uuid().optional(),
});

// POST /api/v1/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  
  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'User already exists',
    });
    return;
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || 'SCHOOL_OWNER',
      schoolId: data.schoolId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      schoolId: true,
      createdAt: true,
    },
  });
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'amani-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
  
  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
  });
}));

// POST /api/v1/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });
  
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }
  
  // Verify password
  const isValid = await bcrypt.compare(data.password, user.password);
  
  if (!isValid) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'amani-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
      },
      token,
    },
  });
}));

// GET /api/v1/auth/me - Get current user
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      schoolId: true,
      profileImage: true,
      createdAt: true,
    },
  });
  
  res.json({
    success: true,
    data: user,
  });
}));

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

export default router;
