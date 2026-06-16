import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { searchMultiCity } from '../services/multi-city.js';
import type { MultiCityLeg } from '../types/index.js';

const multiCitySchema = z.object({
  legs: z.string(), // JSON array: '[{"origin":"TPE","destination":"NRT","date":"2026-08-01"},{"origin":"NRT","destination":"BKK","date":"2026-08-05"}]'
  topPerLeg: z.coerce.number().int().min(1).max(10).optional().default(5),
  maxResults: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export async function multiCityRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/flights/multi-city — multi-city / open-jaw search
  // Example: /api/flights/multi-city?legs=[{"origin":"TPE","destination":"NRT","date":"2026-08-01"},{"origin":"NRT","destination":"BKK","date":"2026-08-05"}]
  app.get('/api/flights/multi-city', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = multiCitySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }

    let legs: MultiCityLeg[];
    try {
      const raw = JSON.parse(parsed.data.legs);
      if (!Array.isArray(raw) || raw.length < 2) throw new Error();
      // Validate each leg
      for (const leg of raw) {
        if (
          typeof leg.origin !== 'string' || leg.origin.length !== 3 ||
          typeof leg.destination !== 'string' || leg.destination.length !== 3 ||
          typeof leg.date !== 'string'
        ) {
          throw new Error('Each leg must have origin (3-char IATA), destination (3-char IATA), and date (YYYY-MM-DD)');
        }
      }
      legs = raw;
    } catch {
      return reply.status(400).send({
        error: 'Invalid legs JSON. Format: [{"origin":"TPE","destination":"NRT","date":"2026-08-01"},{"origin":"NRT","destination":"BKK","date":"2026-08-05"}]',
        details: {},
      });
    }

    const { topPerLeg, maxResults } = parsed.data;

    try {
      const { itineraries } = await searchMultiCity(legs, topPerLeg, maxResults);

      if (itineraries.length === 0) {
        return reply.send({
          legs,
          itineraries: [],
          meta: { totalLegs: legs.length, itinerariesFound: 0, priceRange: { min: 0, max: 0 }, cheapestTotal: 0, mostExpensive: 0 },
        });
      }

      const prices = itineraries.map((i) => i.totalPrice);
      const meta = {
        totalLegs: legs.length,
        itinerariesFound: itineraries.length,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        cheapestTotal: itineraries[0].totalPrice,
        mostExpensive: itineraries[itineraries.length - 1].totalPrice,
      };

      return reply.send({ legs, itineraries, meta });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Multi-city search failed';
      app.log.error({ err, legs }, 'multi-city error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });
}