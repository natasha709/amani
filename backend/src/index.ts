// Amani School System - Backend API Entry Point
// Main Express application setup

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import schoolRoutes from './routes/school.routes';
import studentRoutes from './routes/student.routes';
import academicRoutes from './routes/academic.routes';
import feeRoutes from './routes/fee.routes';
import paymentRoutes from './routes/payment.routes';
import saccoRoutes from './routes/sacco.routes';
import communicationRoutes from './routes/communication.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';

// Import database
import { prisma } from './config/database';

// Initialize express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Amani School System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/academics', academicRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/sacco', saccoRoutes);
app.use('/api/v1/communications', communicationRoutes);
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);

// Protected route example
app.get('/api/v1/me', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      schoolId: true,
    },
  });
  
  res.json(user);
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`✓ Amani API Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  API URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
