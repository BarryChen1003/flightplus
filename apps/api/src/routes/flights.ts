import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { searchCheapFlights, getNearestPlacesMatrix } from '../services/travelpayouts.js';
import { getCachedFlightSearch } from '../services/cache.js';
import type { FlightSearchResponse, NearestAirportResponse, FlightSearchQuery, NearestAirportQuery } from '../types/index.js';

const flightSearchSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
  currency: z.string().optional().default('USD'),
});

const nearestAirportSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
});

export async function flightsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/search
  app.get('/api/flights/search', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = flightSearchSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const q = parsed.data as FlightSearchQuery;

    try {
      const flights = await searchCheapFlights(q.origin, q.destination, q.departDate);
      const response: FlightSearchResponse = {
        flights,
        meta: { count: flights.length, cached: false },
      };

      // Check cache for cached flag
      const cached = await getCachedFlightSearch(q.origin, q.destination, q.departDate);
      if (cached) {
        response.meta.cached = true;
        response.meta.cachedAt = cached.cachedAt;
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Flight search failed';
      app.log.error({ err, q }, 'flight search error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });

  // GET /api/flights/nearest-airports
  app.get('/api/flights/nearest-airports', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = nearestAirportSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const q = parsed.data as NearestAirportQuery;

    try {
      const airports = await getNearestPlacesMatrix(q.origin, q.destination, q.date);
      const response: NearestAirportResponse = {
        origin: q.origin,
        date: q.date,
        airports,
        meta: { count: airports.length, cached: false },
      };
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nearest airports search failed';
      app.log.error({ err, q }, 'nearest airports error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });

  // GET /api/flights/calendar — stub for Strategy 2/6
  app.get('/api/flights/calendar', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      origin: z.string().length(3).toUpperCase(),
      destination: z.string().length(3).toUpperCase(),
      month: z.string().regex(/^\d{4}-\d{2}$/),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }

    // TODO: integrate with TP month-matrix endpoint (Phase 2)
    return reply.status(501).send({
      error: 'Not implemented',
      message: 'Calendar data will be available in Phase 2 via Python Worker',
    });
  });
}