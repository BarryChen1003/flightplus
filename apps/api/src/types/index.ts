// === Shared Types for FlightPlus ===

export interface FlightOption {
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departure: string;    // ISO datetime
  arrival: string;     // ISO datetime
  duration: number;     // minutes
  stops: number;        // 0 = direct
  origin: string;       // IATA code
  destination: string;  // IATA code
  affiliateUrl: string;
}

export interface NearestAirport {
  iata: string;
  name: string;
  distance: number;     // km
  priceDiff: number;    // vs origin price (USD)
  savings: number;      // estimated savings (TWD)
  flights: FlightOption[];
}

export interface HotelOption {
  name: string;
  location: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  rating: number;        // 0-10 scale
  affiliateUrl: string;
  imageUrl?: string;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departDate: string;   // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
  currency?: string;
}

export interface HotelSearchQuery {
  location: string;
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;      // YYYY-MM-DD
  guests?: number;
}

export interface NearestAirportQuery {
  origin: string;        // IATA
  date: string;          // YYYY-MM-DD
  passengers?: number;
}

export interface SearchMeta {
  count: number;
  cached: boolean;
  cachedAt?: string;
}

export interface FlightSearchResponse {
  flights: FlightOption[];
  meta: SearchMeta;
}

export interface HotelSearchResponse {
  hotels: HotelOption[];
  meta: SearchMeta;
}

export interface NearestAirportResponse {
  origin: string;
  date: string;
  airports: NearestAirport[];
  meta: SearchMeta;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
}

// Travelpayouts API types
export interface TPAirport {
  code: string;          // IATA
  name: string;
  country_name: string;
  city_name: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface TPAirline {
  code: string;
  name: string;
}

export interface TPCity {
  code: string;
  name: string;
  country_name: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface TPPriceCheap {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  price: number;
  airline: string;
  flight_number?: string;
  number_of_changes: number;
  found_at?: string;
}

export interface TPPriceLatest {
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  departure: string;
  arrival: string;
  departure_airport: string;
  arrival_airport: string;
  price: number;
  currency: string;
  airlines: string[];
  duration: number;
  link: string;
}