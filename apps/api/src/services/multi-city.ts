/**
 * Multi-city Search Service (Strategy 4)
 *
 * Searches multiple legs in parallel, combines cheapest per-leg results into
 * complete itineraries, and surfaces savings vs booking each leg separately.
 */

import { searchCheapFlights } from './travelpayouts.js';
import { buildAffiliateUrl } from './affiliates.js';
import type { MultiCityLeg, MultiCityLegResult, MultiCityItinerary } from '../types/index.js';

const TWD_RATE = 32; // USD → TWD conversion

/**
 * Search multiple legs in parallel, return top-N cheapest combos.
 * Default: top 5 flights per leg → cartesian product → top 20 by total price.
 */
export async function searchMultiCity(
  legs: MultiCityLeg[],
  topPerLeg = 5,
  maxResults = 20,
): Promise<{ legResults: MultiCityLegResult[]; itineraries: MultiCityItinerary[] }> {
  if (legs.length < 2) {
    throw new Error('Multi-city requires at least 2 legs');
  }

  // Parallel fetch all legs
  const legFlights = await Promise.all(
    legs.map(async (leg, idx) => {
      const flights = await searchCheapFlights(leg.origin, leg.destination, leg.date);
      const sorted = [...flights].sort((a, b) => a.price - b.price);
      const top = sorted.slice(0, topPerLeg);
      return {
        legIndex: idx,
        origin: leg.origin,
        destination: leg.destination,
        date: leg.date,
        flights: top,
        cheapestPrice: top[0]?.price ?? 0,
        cheapestFlight: top[0] ?? null,
      } satisfies MultiCityLegResult;
    }),
  );

  // Filter legs that have no results
  const validLegResults = legFlights.filter((r) => r.flights.length > 0);
  if (validLegResults.length < legs.length) {
    const missing = legs
      .filter((_, i) => !legFlights[i] || legFlights[i].flights.length === 0)
      .map((l) => `${l.origin}→${l.destination}`);
    console.warn(`[Multi-city] No results for legs: ${missing.join(', ')}`);
  }

  // Cartesian product of top-N per leg
  const combos = cartesian(validLegResults.map((r) => r.flights));

  // Build itineraries
  const allLegResults: MultiCityLegResult[] = legFlights;
  const itineraries: MultiCityItinerary[] = combos
    .slice(0, maxResults)
    .map((combo) => {
      const totalPrice = combo.reduce((sum, f) => sum + f.price, 0);
      const totalDuration = combo.reduce((sum, f) => sum + f.duration, 0);
      const totalStops = combo.reduce((sum, f) => sum + f.stops, 0);

      const searchParams = combo
        .map((f) => `origin_iata=${f.origin}&destination_iata=${f.destination}`)
        .join('&');
      const dateParams = combo.map((f) => `depart_date=${f.departure.slice(0, 10)}`).join('&');
      const affiliateUrl = buildAffiliateUrl(
        `https://www.aviasales.ru/search?${searchParams}&${dateParams}`,
      );

      // Savings: compare total vs sum of each leg's cheapest alone
      // (already using top-N per leg, so this is implicit — just show vs booking separately)
      const separateTotal = allLegResults.reduce((sum, r) => sum + r.cheapestPrice, 0);
      const savingsTwd = Math.round((separateTotal - totalPrice) * TWD_RATE);

      return {
        legs: allLegResults.map((r, i) => ({
          legIndex: i,
          origin: r.origin,
          destination: r.destination,
          date: r.date,
          flights: r.flights,
          cheapestPrice: r.cheapestPrice,
          cheapestFlight: r.cheapestFlight,
        })),
        totalPrice,
        currency: 'USD',
        totalDuration,
        totalStops,
        savingsVsDirect: savingsTwd > 0 ? savingsTwd : 0,
        affiliateUrl,
      } satisfies MultiCityItinerary;
    })
    .sort((a, b) => a.totalPrice - b.totalPrice);

  return { legResults: allLegResults, itineraries };
}

/**
 * Cartesian product of N arrays (up to 6 legs = 15625 combos max with topN=5)
 */
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0].map((x) => [x]);

  return arrays.reduce<T[][]>((acc, arr) => {
    const result: T[][] = [];
    for (const combo of acc) {
      for (const item of arr) {
        result.push([...combo, item]);
      }
    }
    return result;
  }, [[]]);
}