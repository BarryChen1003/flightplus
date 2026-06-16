import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getFlightDecision } from '../services/decision-board.js';

const decisionSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  airline: z.string().min(1),
  iata: z.string().length(2).toUpperCase(),
  baseFare: z.coerce.number().min(0),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
});

export async function decisionRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/flights/decision — full decision board: fee + refund + promotion
  // Example: /api/flights/decision?origin=TPE&destination=NRT&departDate=2026-08-01&airline=EVA Air&iata=BR&baseFare=180&passengers=1
  app.get('/api/flights/decision', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = decisionSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, destination, departDate, airline, iata, baseFare, passengers } = parsed.data;

    if (origin === destination) {
      return reply.status(400).send({ error: 'Origin and destination must be different', details: {} });
    }

    try {
      const result = await getFlightDecision(origin, destination, departDate, airline, iata, baseFare, passengers);

      return reply.send({
        success: true,
        data: result,
        meta: {
          scoreBreakdown: { price: '40%', flexibility: '35%', transparency: '25%' },
          tip: `verdict.score 為 0-100，75+ 建議立即預訂，55-74 可再觀望，<55 建議多比較`,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Decision analysis failed';
      app.log.error({ err, origin, destination }, 'decision error');
      return reply.status(502).send({ error: 'Analysis error', details: message });
    }
  });
}