import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { discoverHiddenDestinations, findCheaperAlternatives } from '../services/hidden-destinations.js';

const hiddenDestSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  budget: z.coerce.number().min(0).max(2000).optional(),
  region: z.string().optional(),
});

const altAirportsSchema = z.object({
  destination: z.string().length(3).toUpperCase(),
  maxDistanceKm: z.coerce.number().min(10).max(500).optional().default(200),
});

export async function hiddenDestinationRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/flights/hidden-destinations — discover lesser-known affordable destinations
  app.get('/api/flights/hidden-destinations', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = hiddenDestSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, month, budget, region } = parsed.data;

    try {
      const result = await discoverHiddenDestinations(origin, month, budget, region);
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hidden destinations search failed';
      app.log.error({ err }, 'hidden-destinations error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });

  // GET /api/flights/hidden-destinations/alternatives — cheaper nearby airports for a destination
  app.get('/api/flights/hidden-destinations/alternatives', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = altAirportsSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { destination, maxDistanceKm } = parsed.data;

    try {
      const alternatives = await findCheaperAlternatives(destination, maxDistanceKm);
      return reply.send({
        success: true,
        data: {
          destination,
          alternatives,
          meta: {
            totalFound: alternatives.length,
            tip: '使用鄰近機場可省下 NT$150-400，且有時航班更頻繁',
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Alternative airports search failed';
      app.log.error({ err }, 'alternatives error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });

  // GET /api/flights/hidden-destinations/explore — browse by region
  app.get('/api/flights/hidden-destinations/explore', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      origin: z.string().length(3).toUpperCase(),
      region: z.enum(['NEAsia', 'SEAsia', 'EastAsia', 'Oceania', 'Americas', 'Europe', 'SouthAsia', 'MiddleEast', 'Africa']),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, region } = parsed.data;

    try {
      const result = await discoverHiddenDestinations(origin, undefined, undefined, region);
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Region explore failed';
      app.log.error({ err }, 'explore error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });
}