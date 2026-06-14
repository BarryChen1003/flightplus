import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { initCache } from './services/cache.js';
import { healthRoutes } from './routes/health.js';
import { flightsRoutes } from './routes/flights.js';
import { hotelsRoutes } from './routes/hotels.js';
import { negotiationRoutes } from './routes/negotiation.js';
import { promotionRoutes } from './routes/promotions.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  // Security middleware
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Cache
  const redisUrl = process.env.REDIS_URL;
  initCache(redisUrl);

  // Routes
  await app.register(healthRoutes);
  await app.register(flightsRoutes);
  await app.register(hotelsRoutes);
  await app.register(negotiationRoutes);
  await app.register(promotionRoutes);

  // Start
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 FlightPlus API running on http://0.0.0.0:${PORT}`);
    app.log.info(`📡 Redis: ${redisUrl ? 'connected' : 'in-memory fallback'}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();