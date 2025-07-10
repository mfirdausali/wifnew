import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import logger from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected successfully');

    // Create HTTP server
    const server = createServer(app);

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📱 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      logger.info(`🔧 API URL: http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      await prisma.$disconnect();
      logger.info('Database connection closed');

      await redis.quit();
      logger.info('Redis connection closed');

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();