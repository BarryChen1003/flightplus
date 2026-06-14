import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { searchCheapFlights, getNearestPlacesMatrix, getCalendarPrices } from '../services/travelpayouts.js';
import { getCachedFlightSearch } from '../services/cache.js';
import type { FlightSearchResponse, NearestAirportResponse, FlightSearchQuery, NearestAirportQuery, BestDatesResponse, CalendarDay } from '../types/index.js';

const flightSearchSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
  currency: z.string().optional().default('USD'),
});

function generateMockCalendar(
  _origin: string,
  _destination: string,
  month: string,
): Array<{ date: string; price: number; airline: string; stops: number }> {
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const AIRLINES = ['Eva Air', 'China Airlines', 'Japan Airlines', 'Peach Aviation', 'Cathay Pacific'];
  const result: Array<{ date: string; price: number; airline: string; stops: number }> = [];

  // Generate realistic price variation (weekends + midweek pattern)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const dow = new Date(year, monthNum - 1, day).getDay();
    // Friday/Saturday departures are more expensive, Tuesday/Wednesday cheaper
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const basePrice = isWeekend ? 140 + Math.floor(Math.random() * 80) : 90 + Math.floor(Math.random() * 70);
    result.push({
      date,
      price: Math.round(basePrice),
      airline: AIRLINES[day % AIRLINES.length],
      stops: day % 5 === 0 ? 1 : 0, // every 5th day has 1 stop
    });
  }
  return result;
}

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

  // GET /api/flights/best-dates — Strategy 1 & 6: find cheapest departure dates in a month
  app.get('/api/flights/best-dates', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      origin: z.string().length(3).toUpperCase(),
      destination: z.string().length(3).toUpperCase(),
      month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
      directOnly: z.string().optional().default('false'),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, destination, month, directOnly } = parsed.data;
    const filterDirect = directOnly === 'true';

    try {
      const { dates } = await getCalendarPrices(origin, destination, month);

      // Fallback mock data if TP API returned nothing (no token / not subscribed)
      const rawDates = dates.length > 0 ? dates : generateMockCalendar(origin, destination, month);

      // Filter to only direct if requested
      const filtered = filterDirect ? rawDates.filter((d) => d.stops === 0) : rawDates;

      // Sort by price asc
      filtered.sort((a, b) => a.price - b.price);

      const prices = filtered.map((d) => d.price);
      const avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
      const minPrice = prices[0] ?? 0;
      const maxPrice = prices[prices.length - 1] ?? 0;
      const savingsVsAvg = avgPrice > 0 ? Math.round(((avgPrice - minPrice) / avgPrice) * 100) : 0;

      const calendarDays: CalendarDay[] = filtered.map((d) => ({
        date: d.date,
        price: d.price,
        airline: d.airline,
        flights: 1,
        direct: d.stops === 0,
      }));

      const response: BestDatesResponse = {
        origin,
        destination,
        month,
        dates: calendarDays,
        cheapest: calendarDays[0],
        meta: {
          daysAnalyzed: filtered.length,
          avgPrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          savingsVsAvg,
          directOnly: filterDirect,
        },
      };

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Best dates search failed';
      app.log.error({ err }, 'best-dates error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });
}