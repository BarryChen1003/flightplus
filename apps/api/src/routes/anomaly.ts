import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { detectAnomalies } from '../services/anomaly-detector.js';

const querySchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format: YYYY-MM'),
  minSeverity: z.enum(['low', 'medium', 'high', 'extreme']).optional().default('medium'),
});

export async function anomalyRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/anomaly
  app.get('/api/flights/anomaly', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        details: parsed.error.format(),
      });
    }

    const { origin, destination, month, minSeverity } = parsed.data;

    try {
      const report = await detectAnomalies(origin, destination, month, minSeverity);
      return reply.send(report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      app.log.error({ err, origin, destination, month }, '[anomaly] detectAnomalies failed');
      return reply.status(502).send({ error: 'Anomaly detection failed', detail: msg });
    }
  });
}