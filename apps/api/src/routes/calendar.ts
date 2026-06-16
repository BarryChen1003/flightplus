import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCalendarAnalytics } from '../services/calendar-prices.js';

const querySchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format: YYYY-MM'),
});

export async function calendarRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/calendar
  app.get('/api/flights/calendar', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        details: parsed.error.format(),
      });
    }

    const { origin, destination, month } = parsed.data;

    try {
      const result = await getCalendarAnalytics(origin, destination, month);
      return reply.send(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      app.log.error({ err, origin, destination, month }, '[calendar] getCalendarAnalytics failed');
      return reply.status(502).send({ error: 'Calendar search failed', detail: msg });
    }
  });
}