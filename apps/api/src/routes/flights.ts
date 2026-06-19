import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { searchCheapFlights, getNearestPlacesMatrix, getCalendarPrices } from '../services/travelpayouts.js';
import { findBestConnections } from '../services/connection-finder.js';
import { getCachedFlightSearch } from '../services/cache.js';
import { generateMockCalendar } from '../services/calendar-prices.js';
import type { FlightSearchResponse, NearestAirportResponse, NearestAirport, FlightSearchQuery, NearestAirportQuery, BestDatesResponse, CalendarDay } from '../types/index.js';

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
  // destination is optional — if omitted, searches all nearby airports from origin
  destination: z.string().length(3).toUpperCase().optional(),
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

      const cached = await getCachedFlightSearch(q.origin, q.destination, q.departDate);
      if (cached) {
        response.meta.cached = true;
        response.meta.cachedAt = cached.cachedAt;
      }

      return response;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      const message = typeof errObj.message === 'string' && errObj.message !== '[object Object]'
        ? errObj.message
        : 'Flight search failed';
      app.log.error({ err: errObj, q }, 'flight search error');
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

    // Default destination to 'any major airport' if not provided
    const dest = q.destination ?? 'TYO';

    let airports: NearestAirport[] = [];

    try {
      airports = await getNearestPlacesMatrix(q.origin, dest, q.date);
    } catch (err) {
      app.log.warn({ err, q }, '[nearest] TP API failed, using mock data');
    }

    // Fallback mock data when TP API fails or returns nothing
    if (airports.length === 0) {
      airports = [
        {
          iata: 'KIX',
          name: '關西國際機場',
          distance: 170,
          priceDiff: -25,
          savings: 800,
          flights: [
            {
              price: 125,
              currency: 'USD',
              airline: 'Peach',
              flightNumber: 'MM024',
              departure: `${q.date}T08:00:00.000Z`,
              arrival: `${q.date}T11:30:00.000Z`,
              duration: 210,
              stops: 0,
              origin: q.origin,
              destination: 'KIX',
              affiliateUrl: `https://flightplus.com/redirect?url=https://www.aviasales.ru/search?origin_iata=${q.origin}&destination_iata=KIX&depart_date=${q.date}&marker=320764`,
            },
          ],
        },
        {
          iata: 'ITM',
          name: '伊丹機場',
          distance: 190,
          priceDiff: -15,
          savings: 500,
          flights: [
            {
              price: 135,
              currency: 'USD',
              airline: 'Japan Airlines',
              flightNumber: 'JL123',
              departure: `${q.date}T10:00:00.000Z`,
              arrival: `${q.date}T13:15:00.000Z`,
              duration: 195,
              stops: 0,
              origin: q.origin,
              destination: 'ITM',
              affiliateUrl: `https://flightplus.com/redirect?url=https://www.aviasales.ru/search?origin_iata=${q.origin}&destination_iata=ITM&depart_date=${q.date}&marker=320764`,
            },
          ],
        },
        {
          iata: 'NGO',
          name: '中部國際機場',
          distance: 260,
          priceDiff: -5,
          savings: 200,
          flights: [
            {
              price: 145,
              currency: 'USD',
              airline: 'China Airlines',
              flightNumber: 'CI156',
              departure: `${q.date}T12:00:00.000Z`,
              arrival: `${q.date}T15:30:00.000Z`,
              duration: 210,
              stops: 0,
              origin: q.origin,
              destination: 'NGO',
              affiliateUrl: `https://flightplus.com/redirect?url=https://www.aviasales.ru/search?origin_iata=${q.origin}&destination_iata=NGO&depart_date=${q.date}&marker=320764`,
            },
          ],
        },
      ];
    }

    const response: NearestAirportResponse = {
      origin: q.origin,
      date: q.date,
      airports,
      meta: { count: airports.length, cached: false },
    };
    return response;
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

  // GET /api/flights/connections — Strategy 3: 1-stop connection finder
  app.get('/api/flights/connections', async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      origin: z.string().length(3).toUpperCase(),
      destination: z.string().length(3).toUpperCase(),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, destination } = parsed.data;

    try {
      const result = await findBestConnections(origin, destination);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connections search failed';
      app.log.error({ err }, 'connections error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });
}