import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { runFullAnalysis } from '../services/full-analysis.js';

const fullAnalysisSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
});

export async function fullAnalysisRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/flights/full-analysis — run all strategies, return best verdict
  // Example: /api/flights/full-analysis?origin=TPE&destination=NRT&departDate=2026-08-01&passengers=1
  app.get('/api/flights/full-analysis', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = fullAnalysisSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }

    const { origin, destination, departDate, returnDate, passengers } = parsed.data;

    if (origin === destination) {
      return reply.status(400).send({ error: 'Origin and destination must be different', details: {} });
    }

    try {
      const result = await runFullAnalysis(origin, destination, departDate, returnDate, passengers);

      return reply.send({
        success: true,
        data: result,
        meta: {
          strategies: ['direct', 'nearby_airports', 'connections', 'hidden_destinations'],
          scoring: { price: '40%', convenience: '35%', flexibility: '25%' },
          tip: 'winner 為綜合評分最高選項，不代表最便宜。查看 options 陣列可看所有評分結果。',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Full analysis failed';
      app.log.error({ err, origin, destination, departDate }, 'full-analysis error');
      return reply.status(502).send({ error: 'Analysis error', details: message });
    }
  });
}