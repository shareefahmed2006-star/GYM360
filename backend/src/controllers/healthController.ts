import { Request, Response, NextFunction } from 'express';
import { dbConnection } from '../config/database';
import { config } from '../config/env';

export const getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dbHealth = await dbConnection.checkHealth();
    const isDbConnected = dbHealth.isConnected;

    const healthData = {
      status: isDbConnected ? 'ok' : 'degraded',
      liveness: 'healthy',
      readiness: isDbConnected ? 'ready' : 'unready',
      service: 'gym360-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.nodeEnv,
      database: {
        status: isDbConnected ? 'connected' : 'disconnected',
        pingLatencyMs: isDbConnected && dbHealth.pingTimeMs >= 0 ? dbHealth.pingTimeMs : null,
      },
    };

    const statusCode = isDbConnected ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    next(error);
  }
};
