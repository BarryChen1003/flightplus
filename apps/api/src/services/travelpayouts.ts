import axios from 'axios';
import type { AxiosInstance } from 'axios';
import {
  TPAirport,
  TPAirline,
  TPCity,
  FlightOption,
  NearestAirport,
} from '../types/index.js';
import { buildAffiliateUrl } from './affiliates.js';
import {
  getCachedFlightSearch,
  setCachedFlightSearch,
  getCachedStaticData,
  setCachedStaticData,
} from './cache.js';

const TP_BASE = 'https://api.travelpayouts.com';
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN ?? '';
const LANG = 'zh-TW';
const USD = 'USD';

const AIRLINES = ['Eva Air', 'China Airlines', 'Japan Airlines', 'Peach Aviation', 'StarFlyer'];
const FLIGHT_PREFIXES = ['BR', 'CI', 'JL', 'MM', '6J'];

function buildMockFlights(origin: string, destination: string, departDate: string): FlightOption[] {
  const count = 4 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, (_, i) => {
    const price = 80 + Math.floor(Math.random() * 200);
    const stops = i === 0 ? 0 : Math.random() > 0.6 ? 0 : 1;
    const duration = stops === 0 ? 180 + Math.floor(Math.random() * 60) : 240 + Math.floor(Math.random() * 120);
    const airlineIdx = i % AIRLINES.length;
    const departTime = new Date(departDate);
    departTime.setHours(6 + i * 3, Math.floor(Math.random() * 60), 0, 0);
    const arriveTime = new Date(departTime.getTime() + duration * 60 * 1000);

    return {
      price,
      currency: USD,
      airline: AIRLINES[airlineIdx],
      flightNumber: `${FLIGHT_PREFIXES[airlineIdx]}${100 + i * 11}`,
      departure: departTime.toISOString(),
      arrival: arriveTime.toISOString(),
      duration,
      stops,
      origin,
      destination,
      affiliateUrl: buildAffiliateUrl(
        `https://www.aviasales.ru/search?origin_iata=${origin}&destination_iata=${destination}&depart_date=${departDate}`
      ),
    };
  });
}

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: TP_BASE });
  client.interceptors.request.use((config) => {
    if (TOKEN) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config.headers as any)['X-Access-Token'] = TOKEN;
    }
    return config;
  });
  return client;
}

const http = createClient();

// --- Static Data (cached 24h) ---

let _airportData: TPAirport[] | null = null;
let _airlineData: TPAirline[] | null = null;
let _cityData: TPCity[] | null = null;

export async function getAirports(): Promise<TPAirport[]> {
  if (_airportData) return _airportData;
  const cached = await getCachedStaticData('airports', LANG);
  if (cached) {
    _airportData = JSON.parse(cached) as TPAirport[];
    return _airportData;
  }
  const { data } = await http.get<TPAirport[]>(`/data/${LANG}/airports.json`);
  _airportData = data;
  await setCachedStaticData('airports', LANG, data);
  return data;
}

export async function getAirlines(): Promise<TPAirline[]> {
  if (_airlineData) return _airlineData;
  const cached = await getCachedStaticData('airlines', LANG);
  if (cached) {
    _airlineData = JSON.parse(cached) as TPAirline[];
    return _airlineData;
  }
  const { data } = await http.get<TPAirline[]>(`/data/${LANG}/airlines.json`);
  _airlineData = data;
  await setCachedStaticData('airlines', LANG, data);
  return data;
}

export async function getCities(): Promise<TPCity[]> {
  if (_cityData) return _cityData;
  const cached = await getCachedStaticData('cities', LANG);
  if (cached) {
    _cityData = JSON.parse(cached) as TPCity[];
    return _cityData;
  }
  const { data } = await http.get<TPCity[]>(`/data/${LANG}/cities.json`);
  _cityData = data;
  await setCachedStaticData('cities', LANG, data);
  return data;
}

// --- Flight Search ---

function airlineName(code: string, airlines: TPAirline[]): string {
  return airlines.find((a) => a.code === code)?.name ?? code;
}

function estimateArrival(departDate: string, stops: number): string {
  const durationMinutes = 90 + stops * 90;
  return new Date(
    new Date(departDate).getTime() + durationMinutes * 60 * 1000
  ).toISOString();
}

// TP Data API v1 response shape:
// { success: true, data: { DEST_IATA: { "0": { price, airline, flight_number, transfers, departure_at, ... } } }, currency: "usd" }
interface TPDataResponse {
  success: boolean;
  data: Record<string, Record<string, {
    price: number;
    airline: string;
    flight_number?: number;
    transfers: number;
    departure_at: string;
    return_at?: string;
    duration_to?: number;
    duration_back?: number;
    expires_at?: string;
  }>>;
  currency: string;
}

export async function searchCheapFlights(
  origin: string,
  destination: string,
  departDate: string
): Promise<FlightOption[]> {
  const cached = await getCachedFlightSearch(origin, destination, departDate);
  if (cached) {
    const parsed = JSON.parse(cached.data);
    if (parsed._cachedResult) return parsed._cachedResult as FlightOption[];
  }

  let tpData: TPDataResponse;
  try {
    const res = await http.get<TPDataResponse>('/v1/prices/cheap', {
      params: { origin, destination, depart_date: departDate.slice(0, 7), currency: USD, page: 1, limit: 30 },
    });
    tpData = res.data;
  } catch (err) {
    // TP API unreachable — return mock data for development
    console.warn(`[TP] API unreachable (${err instanceof Error ? err.message : err}), returning mock data`);
    const mock = buildMockFlights(origin, destination, departDate);
    await setCachedFlightSearch(origin, destination, departDate, { _cachedResult: mock });
    return mock;
  }

  if (!tpData.success) {
    const mock = buildMockFlights(origin, destination, departDate);
    await setCachedFlightSearch(origin, destination, departDate, { _cachedResult: mock });
    return mock;
  }

  const airlines = await getAirlines();
  const results: FlightOption[] = [];

  // TP response: data[destination_iata][index] = flight
  for (const [destIata, flightsByIndex] of Object.entries(tpData.data)) {
    for (const flight of Object.values(flightsByIndex)) {
      const code = flight.airline ?? '';
      const stops = flight.transfers ?? 0;
      const departure = flight.departure_at ? new Date(flight.departure_at).toISOString() : new Date(departDate).toISOString();
      const durationMin = flight.duration_to ?? (90 + stops * 90);

      results.push({
        price: flight.price,
        currency: USD,
        airline: airlineName(code, airlines),
        flightNumber: flight.flight_number ? String(flight.flight_number) : `${code} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
        departure,
        arrival: flight.duration_to
          ? new Date(new Date(flight.departure_at).getTime() + flight.duration_to * 60 * 1000).toISOString()
          : estimateArrival(departDate, stops),
        duration: durationMin,
        stops,
        origin,
        destination: destIata,
        affiliateUrl: buildAffiliateUrl(
          `https://www.aviasales.ru/search?origin_iata=${origin}&destination_iata=${destIata}&depart_date=${departDate.slice(0, 7)}`
        ),
      });
    }
  }

  await setCachedFlightSearch(origin, destination, departDate, { _cachedResult: results });
  return results;
}

// --- Nearest Places Matrix (Strategy 1 & 5) ---

interface TPNearestPlace {
  airport_from: string;
  airport_to: string;
  distance: number;
  value: number;
  trip_class: number;
  show_to_affiliates: boolean;
  actual: boolean;
  depart_date: string;
  return_date?: string;
  gate: string;
  found_at: string;
}

export async function getNearestPlacesMatrix(
  origin: string,
  destination: string,
  date: string
): Promise<NearestAirport[]> {
  const { data } = await http.get<{ prices: TPNearestPlace[] }>('/v2/prices/nearest-places-matrix', {
    params: {
      origin,
      destination,
      currency: USD,
      period_type: 'month',
      beginning_of_period: date,
    },
  });

  if (!data.prices?.length) return [];

  const airports = await getAirports();
  const airportMap = new Map(airports.map((a) => [a.code, a]));

  // Group by destination airport
  const grouped = new Map<string, TPNearestPlace[]>();
  for (const p of data.prices) {
    if (!grouped.has(p.airport_to)) grouped.set(p.airport_to, []);
    grouped.get(p.airport_to)!.push(p);
  }

  const results: NearestAirport[] = [];
  for (const [iata, prices] of grouped) {
    const airport = airportMap.get(iata);
    const bestPrice = Math.min(...prices.map((p) => p.value));
    const originPriceEntry = prices.find((p) => p.airport_from === origin);
    const originPrice = originPriceEntry?.value ?? bestPrice;
    const priceDiff = originPrice - bestPrice;
    const savingsTwd = Math.round(priceDiff * 32);

    const flights: FlightOption[] = prices.slice(0, 3).map((p: TPNearestPlace) => ({
      price: p.value,
      currency: USD,
      airline: p.gate,
      flightNumber: '—',
      departure: new Date(p.depart_date).toISOString(),
      arrival: '',
      duration: 0,
      stops: 0,
      origin: p.airport_from,
      destination: p.airport_to,
      affiliateUrl: buildAffiliateUrl(
        `https://www.aviasales.ru/search?origin_iata=${p.airport_from}&destination_iata=${p.airport_to}&depart_date=${p.depart_date}`
      ),
    }));

    results.push({
      iata,
      name: airport?.name ?? iata,
      distance: prices[0].distance,
      priceDiff,
      savings: savingsTwd > 0 ? savingsTwd : 0,
      flights,
    });
  }

  return results
    .filter((a) => a.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5);
}

// --- Calendar Prices (Strategy 1 & 6 — best date scanner) ---

interface TPCalendarResponse {
  success: boolean;
  data: Record<string, // transfer group: "0", "1", "2"
    Array<{
      price: number;
      airline: string;
      flight_number?: string;
      departure_at: string;
      return_at?: string;
      expires_at: string;
    }>
  >;
}

export async function getCalendarPrices(
  origin: string,
  destination: string,
  month: string, // YYYY-MM
): Promise<{ dates: Array<{ date: string; price: number; airline: string; stops: number }> }> {
  let tpData: TPCalendarResponse;
  try {
    const res = await http.get<TPCalendarResponse>('/v1/prices/calendar', {
      params: {
        origin,
        destination,
        depart_date: month, // YYYY-MM format
        calendar_type: 'departure_date',
        currency: USD,
      },
    });
    tpData = res.data;
  } catch (err) {
    console.warn(`[TP Calendar] API unreachable: ${err instanceof Error ? err.message : err}`);
    return { dates: [] };
  }

  if (!tpData.success) {
    return { dates: [] };
  }

  // Find cheapest flight per day across all transfer groups
  const priceByDate = new Map<string, { date: string; price: number; airline: string; stops: number }>();

  for (const [stopsStr, flights] of Object.entries(tpData.data)) {
    const stops = parseInt(stopsStr, 10);
    for (const flight of flights) {
      // Extract date part from ISO datetime "2026-08-01T14:30:00Z"
      const date = flight.departure_at.slice(0, 10);
      const existing = priceByDate.get(date);
      if (!existing || flight.price < existing.price) {
        priceByDate.set(date, {
          date,
          price: flight.price,
          airline: flight.airline,
          stops,
        });
      }
    }
  }

  return { dates: Array.from(priceByDate.values()) };
}