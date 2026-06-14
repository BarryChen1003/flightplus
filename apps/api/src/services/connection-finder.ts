import axios from 'axios';
import { searchCheapFlights } from './travelpayouts.js';

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN ?? '';

async function getCityDirections(
  origin: string,
  limit = 30,
): Promise<Array<{ iata: string; searches: number }>> {
  try {
    const res = await axios.get('https://api.travelpayouts.com/v1/city-directions', {
      params: { origin, currency: 'USD', limit },
      headers: TOKEN ? { 'X-Access-Token': TOKEN } : {},
      timeout: 5000,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any;
    if (data?.success && data?.data) {
      return Object.entries(data.data as Record<string, number>)
        .map(([iata, searches]) => ({ iata, searches: searches as number }))
        .sort((a, b) => b.searches - a.searches);
    }
  } catch { /* ignore */ }
  return [];
}

async function find1StopConnections(
  origin: string,
  destination: string,
): Promise<Array<{ route: string[]; leg1Price: number; leg2Price: number; totalPrice: number; flights: number }>> {
  const results: Array<{ route: string[]; leg1Price: number; leg2Price: number; totalPrice: number; flights: number }> = [];

  const [originDests, destDests] = await Promise.all([
    getCityDirections(origin, 30),
    getCityDirections(destination, 30),
  ]);

  const originIatas = new Set(originDests.map((d) => d.iata));

  for (const hub of destDests) {
    if (hub.iata === origin || hub.iata === destination) continue;
    if (!originIatas.has(hub.iata)) continue;
    if (hub.searches < 1000) continue;

    try {
      const [leg1Flights, leg2Flights] = await Promise.all([
        searchCheapFlights(origin, hub.iata, new Date().toISOString().slice(0, 10)),
        searchCheapFlights(hub.iata, destination, new Date().toISOString().slice(0, 10)),
      ]);

      if (leg1Flights.length === 0 || leg2Flights.length === 0) continue;

      const leg1Price = Math.min(...leg1Flights.map((f) => f.price));
      const leg2Price = Math.min(...leg2Flights.map((f) => f.price));
      const totalPrice = leg1Price + leg2Price;

      results.push({
        route: [origin, hub.iata, destination],
        leg1Price,
        leg2Price,
        totalPrice,
        flights: 2,
      });
    } catch { /* continue */ }
  }

  results.sort((a, b) => a.totalPrice - b.totalPrice);
  return results.slice(0, 5);
}

export async function findBestConnections(
  origin: string,
  destination: string,
): Promise<{
  directPrice: number;
  connections: Array<{
    route: string[];
    totalPrice: number;
    leg1Price: number;
    leg2Price: number;
    savings: number;
    savingsPercent: number;
    flights: number;
    breakdown: string;
  }>;
}> {
  // Direct flight baseline
  let directPrice = Infinity;
  try {
    const directFlights = await searchCheapFlights(origin, destination, new Date().toISOString().slice(0, 10));
    if (directFlights.length > 0) {
      directPrice = Math.min(...directFlights.map((f) => f.price));
    }
  } catch { /* ignore */ }

  if (directPrice === Infinity) {
    directPrice = 180;
  }

  const rawConnections = await find1StopConnections(origin, destination);

  return {
    directPrice,
    connections: rawConnections
      .filter((c) => c.totalPrice < directPrice)
      .map((c) => {
        const savings = directPrice - c.totalPrice;
        return {
          route: c.route,
          totalPrice: c.totalPrice,
          leg1Price: c.leg1Price,
          leg2Price: c.leg2Price,
          savings,
          savingsPercent: Math.round((savings / directPrice) * 100),
          flights: c.flights,
          breakdown: c.route.join(' → '),
        };
      }),
  };
}