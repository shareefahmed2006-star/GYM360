import { createApp } from './app';
import { config } from './config/env';
import { dbConnection } from './config/database';
import http from 'http';

const startServer = async (): Promise<void> => {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await dbConnection.connect();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(config.port, () => {
      console.log(`[Server] GYM360 Backend running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`[Server] Health check available at: http://localhost:${config.port}/api/health`);
    });

    // Graceful Shutdown handler
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await dbConnection.disconnect();
        console.log('[Server] Shutdown complete.');
        process.exit(0);
      });

      // Force close if graceful shutdown takes longer than 10s
      setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('[Server] Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('[Server] Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
