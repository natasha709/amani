// Amani School System - Authentication Middleware
// JWT authentication and authorization

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    schoolId?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'amani-secret-key-change-in-production';

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
      return;
    }

    console.log('User schoolId:', user.schoolId); // Debug log

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || undefined,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// School ownership verification
export const verifySchoolAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const schoolId = req.params.schoolId || req.body.schoolId;

  if (!schoolId) {
    next();
    return;
  }

  // Super admin has access to all schools
  if (req.user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // Check if user has access to this school
  if (req.user?.schoolId !== schoolId) {
    res.status(403).json({
      success: false,
      message: 'Access denied to this school',
    });
    return;
  }

  next();
};
