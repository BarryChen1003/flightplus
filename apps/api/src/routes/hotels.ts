import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { HotelSearchResponse } from '../types/index.js';

export async function hotelsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/hotels/search
  app.get('/api/hotels/search', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      location: z.string().min(2),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      guests: z.coerce.number().int().min(1).max(10).optional().default(1),
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }

    // TODO: Travelpayouts Hotels API integration — stub for Phase 2
    // TP Hotels API requires separate registration + higher commission tier
    // For Phase 1, this endpoint is a placeholder that returns empty results
    const response: HotelSearchResponse = {
      hotels: [],
      meta: { count: 0, cached: false },
    };
    return response;
  });
}