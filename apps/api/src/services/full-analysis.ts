/**
 * Full Analysis Service (Strategy 7)
 *
 * Runs all available strategies in parallel and returns a unified recommendation.
 * Acts as the "final verdict" engine — scores every option and surfaces the best.
 */

import { searchCheapFlights } from './travelpayouts.js';
import { getNearestPlacesMatrix } from './travelpayouts.js';
import { getCalendarPrices } from './travelpayouts.js';
import { findBestConnections } from './connection-finder.js';
import { discoverHiddenDestinations } from './hidden-destinations.js';
import type { FlightOption } from '../types/index.js';
import type { ScoredOption, FullAnalysisResult } from '../types/index.js';

const TWD_RATE = 32;

const WEIGHTS = { price: 0.40, convenience: 0.35, flexibility: 0.25 };

function scoreFlights(flights: FlightOption[]): { totalPrice: number; totalDuration: number; totalStops: number } {
  return {
    totalPrice: flights.reduce((sum, f) => sum + f.price, 0),
    totalDuration: flights.reduce((sum, f) => sum + f.duration, 0),
    totalStops: flights.reduce((sum, f) => sum + f.stops, 0),
  };
}

function normalize(min: number, max: number, value: number): number {
  if (max === min) return 50;
  return Math.round(((max - value) / (max - min)) * 100);
}

function calcOverall(
  priceScore: number,
  convenienceScore: number,
  flexScore = 70,
): number {
  return Math.round(WEIGHTS.price * priceScore + WEIGHTS.convenience * convenienceScore + WEIGHTS.flexibility * flexScore);
}

function buildScoredOption(
  type: ScoredOption['type'],
  label: string,
  flights: FlightOption[],
  whyGood: string,
  flexScore: number,
  minPrice: number,
  maxPrice: number,
  minDuration: number,
  maxDuration: number,
): ScoredOption | null {
  if (flights.length === 0) return null;
  const { totalPrice, totalDuration, totalStops } = scoreFlights(flights);
  const priceScore = normalize(minPrice, maxPrice, totalPrice);
  const durationScore = normalize(minDuration, maxDuration, totalDuration);
  const convenienceScore = Math.max(0, durationScore - totalStops * 15);
  return {
    type,
    label,
    flights,
    totalPrice,
    currency: 'USD',
    totalDuration,
    totalStops,
    priceScore,
    convenienceScore,
    flexScore,
    overallScore: calcOverall(priceScore, convenienceScore, flexScore),
    whyGood,
    affiliateUrl: flights[0]?.affiliateUrl ?? '',
  };
}

export async function runFullAnalysis(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string,
  passengers = 1,
): Promise<FullAnalysisResult> {
  const analysisId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passengersNum = Math.max(1, Math.min(9, passengers));

  // All strategies in parallel — failures are isolated
  const [directResult, nearbyResult, _calendarResult, connectionsResult, hiddenResult] = await Promise.allSettled([
    searchCheapFlights(origin, destination, departDate),
    getNearestPlacesMatrix(origin, destination, departDate),
    getCalendarPrices(origin, destination, departDate),
    findBestConnections(origin, destination),
    discoverHiddenDestinations(origin),
  ]);

  const directFlights: FlightOption[] = directResult.status === 'fulfilled' ? directResult.value : [];
  const nearestAirports = nearbyResult.status === 'fulfilled' ? nearbyResult.value : [];
  const connData = connectionsResult.status === 'fulfilled' ? connectionsResult.value : { directPrice: 0, connections: [] };
  const hiddenDests = hiddenResult.status === 'fulfilled' ? hiddenResult.value.destinations ?? [] : [];

  // Price/duration range for normalization
  const allFlights = [
    ...directFlights,
    ...nearestAirports.flatMap((a) => a.flights),
  ];
  const prices = allFlights.map((f) => f.price).filter((p) => p > 0);
  const durations = allFlights.map((f) => f.duration).filter((d) => d > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1000;
  const minDuration = durations.length ? Math.min(...durations) : 0;
  const maxDuration = durations.length ? Math.max(...durations) : 2000;

  const scoredOptions: ScoredOption[] = [];

  // 1. Direct flights
  if (directFlights.length > 0) {
    const sorted = [...directFlights].sort((a, b) => a.price - b.price);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const why = best.stops === 0
      ? '直飛，省時最方便'
      : `最優惠航班 NT$${Math.round(best.price * TWD_RATE)}，最貴 NT$${Math.round(worst.price * TWD_RATE)}`;
    scoredOptions.push({
      type: 'direct',
      label: `直飛 ${origin}→${destination}`,
      flights: sorted,
      totalPrice: best.price,
      currency: 'USD',
      totalDuration: best.duration,
      totalStops: best.stops,
      priceScore: normalize(minPrice, maxPrice, best.price),
      convenienceScore: Math.max(0, normalize(minDuration, maxDuration, best.duration) - best.stops * 15),
      flexScore: 85,
      overallScore: calcOverall(normalize(minPrice, maxPrice, best.price), Math.max(0, normalize(minDuration, maxDuration, best.duration) - best.stops * 15), 85),
      whyGood: why,
      affiliateUrl: best.affiliateUrl,
    });
  }

  // 2. Nearby airports (Strategy 1/5)
  for (const apt of nearestAirports.slice(0, 3)) {
    if (apt.flights.length === 0) continue;
    const savingsLabel = apt.savings > 0 ? `省 NT$${apt.savings}` : '';
    scoredOptions.push(
      buildScoredOption(
        'nearby_airport',
        `${apt.iata} ${apt.name} ${apt.distance}km ${savingsLabel}`,
        apt.flights,
        apt.savings > 0 ? `${apt.name} 比直飛便宜 NT$${apt.savings}，距離 ${apt.distance}km` : `${apt.name} 提供替代選項`,
        75,
        minPrice,
        maxPrice,
        minDuration,
        maxDuration,
      )!,
    );
  }

  // 3. 1-stop connections (Strategy 3)
  for (const conn of connData.connections.slice(0, 3)) {
    const connFlights: FlightOption[] = [
      {
        price: conn.leg1Price,
        currency: 'USD',
        airline: '—',
        flightNumber: '—',
        departure: departDate,
        arrival: '',
        duration: 0,
        stops: 1,
        origin,
        destination: conn.route[1] ?? '',
        affiliateUrl: '',
      },
      {
        price: conn.leg2Price,
        currency: 'USD',
        airline: '—',
        flightNumber: '—',
        departure: departDate,
        arrival: '',
        duration: 0,
        stops: 0,
        origin: conn.route[1] ?? '',
        destination,
        affiliateUrl: '',
      },
    ];
    const option = buildScoredOption(
      'connection',
      `${conn.route.join(' → ')} 中轉`,
      connFlights,
      `經 ${conn.route[1]} 中轉，總價 NT$${Math.round(conn.totalPrice * TWD_RATE)}${conn.savings > 0 ? `，比直飛省 NT$${conn.savings}` : ''}`,
      65,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
    );
    if (option) scoredOptions.push(option);
  }

  // 4. Hidden destinations (Strategy 8) — limited by lack of flight data for each dest
  for (const dest of hiddenDests.slice(0, 2)) {
    void dest; // Would need per-destination flight search for full scoring
  }

  // Sort by overall score (highest first)
  scoredOptions.sort((a, b) => b.overallScore - a.overallScore);

  const summary = {
    totalOptionsFound: scoredOptions.length,
    cheapestPrice: scoredOptions.length ? Math.min(...scoredOptions.map((o) => o.totalPrice)) : 0,
    fastestOption: scoredOptions.length ? scoredOptions.reduce((a, b) => a.totalDuration < b.totalDuration ? a : b) : null,
    mostFlexible: scoredOptions.length ? scoredOptions.reduce((a, b) => a.flexScore > b.flexScore ? a : b) : null,
    bestValue: scoredOptions[0] ?? null,
  };

  return {
    id: analysisId,
    origin,
    destination,
    departDate,
    returnDate,
    passengers: passengersNum,
    analyzedAt: new Date().toISOString(),
    status: 'ready',
    options: scoredOptions,
    winner: scoredOptions[0] ?? null,
    summary,
    strategyResults: {
      directFlights: directFlights.length,
      connections: connData.connections.length,
      nearbyAirports: nearestAirports.length,
      hiddenDestinations: hiddenDests.length,
      multiCityCombos: 0,
    },
  };
}