import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { buildPackage } from '../services/package-builder.js';

const querySchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().min(2),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
  minStars: z.coerce.number().int().min(1).max(5).optional(),
});

export async function packageRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/package
  app.get('/api/flights/package', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        details: parsed.error.format(),
      });
    }

    const { origin, destination, departDate, returnDate, passengers, minStars } = parsed.data;

    try {
      const result = buildPackage({ origin, destination, departDate, returnDate, passengers, minStars });
      return reply.send(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      app.log.error({ err }, '[package] buildPackage failed');
      return reply.status(502).send({ error: 'Package build failed', detail: msg });
    }
  });
}