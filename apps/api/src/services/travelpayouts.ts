import axios from 'axios';
import type { AxiosInstance } from 'axios';
import {
  TPAirport,
  TPAirline,
  TPCity,
  TPPriceCheap,
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
const LANG = 'zh';
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
      config.params = { ...config.params, token: TOKEN };
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

  let data: { proposals: TPPriceCheap[] };
  try {
    const res = await http.get<{ proposals: TPPriceCheap[] }>('/v1/prices/cheap', {
      params: { origin, destination, depart_date: departDate, currency: USD, page: 1, limit: 30 },
    });
    data = res.data;
  } catch (err) {
    // TP API unreachable — return mock data for development
    console.warn(`[TP] API unreachable (${err instanceof Error ? err.message : err}), returning mock data`);
    const mock = buildMockFlights(origin, destination, departDate);
    await setCachedFlightSearch(origin, destination, departDate, { _cachedResult: mock });
    return mock;
  }

  const airlines = await getAirlines();

  const results: FlightOption[] = (data.proposals ?? []).map((p: TPPriceCheap) => {
    const code = p.airline ?? '';
    const departure = new Date(departDate).toISOString();
    const stops = p.number_of_changes;

    return {
      price: p.price,
      currency: USD,
      airline: airlineName(code, airlines),
      flightNumber: p.flight_number ?? `${code} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
      departure,
      arrival: estimateArrival(departDate, stops),
      duration: 90 + stops * 90,
      stops,
      origin: p.origin,
      destination: p.destination,
      affiliateUrl: buildAffiliateUrl(
        `https://www.aviasales.ru/search?origin_iata=${origin}&destination_iata=${destination}&depart_date=${departDate}`
      ),
    };
  });

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
  _destination: string,
  date: string
): Promise<NearestAirport[]> {
  const { data } = await http.get<{ prices: TPNearestPlace[] }>('/v2/prices/nearest-places-matrix', {
    params: {
      origin,
      depart_date: date,
      currency: USD,
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