import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import organizationRoutes from './routes/organizationRoutes';
import branchRoutes from './routes/branchRoutes';
import memberRoutes from './routes/memberRoutes';
import membershipPlanRoutes from './routes/membershipPlanRoutes';
import membershipRoutes from './routes/membershipRoutes';
import paymentRoutes from './routes/paymentRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import trainerRoutes from './routes/trainerRoutes';
import trainerSessionRoutes from './routes/trainerSessionRoutes';
import workoutPlanRoutes from './routes/workoutPlanRoutes';
import memberWorkoutPlanRoutes from './routes/memberWorkoutPlanRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import maintenanceLogRoutes from './routes/maintenanceLogRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import testAccessRoutes from './routes/testAccessRoutes';
import trainerPortalRoutes from './routes/trainerPortalRoutes';
import exportRoutes from './routes/exportRoutes';
import { notFoundHandler, globalErrorHandler, AppError } from './middleware/errorHandler';
import { config } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Security Middleware
  app.use(helmet());

  // Environment-driven CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        if (config.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow any local staging / development port on localhost and 127.0.0.1
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new AppError(`Origin '${origin}' not allowed by CORS policy.`, 403));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Base API routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/organization', organizationRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/membership-plans', membershipPlanRoutes);
  app.use('/api/memberships', membershipRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/trainers', trainerRoutes);
  app.use('/api/trainer-sessions', trainerSessionRoutes);
  app.use('/api/workout-plans', workoutPlanRoutes);
  app.use('/api/member-workout-plans', memberWorkoutPlanRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/maintenance-logs', maintenanceLogRoutes);
  app.use('/api/audit-logs', auditLogRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/trainer-portal', trainerPortalRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/test-access', testAccessRoutes);

  // 404 Catch-all handler
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(globalErrorHandler);

  return app;
};
