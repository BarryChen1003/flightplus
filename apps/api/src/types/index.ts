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

export interface CalendarDay {
  date: string;         // YYYY-MM-DD
  price: number;        // USD
  airline: string;
  flights: number;      // number of transfer options
  direct: boolean;     // true if 0 stops available
}

export interface BestDatesResponse {
  origin: string;
  destination: string;
  month: string;        // YYYY-MM
  dates: CalendarDay[];
  cheapest: CalendarDay;
  meta: {
    daysAnalyzed: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    savingsVsAvg: number; // percentage
    directOnly: boolean;
  };
}

export interface PromotionResponse {
  origin: string;
  destination: string;
  analyzedAt: string;
  hasActivePromotion: boolean;
  deals: Array<{
    airline: string;
    price: number;
    currency: string;
    departureDate: string;
    originalPrice: number;
    discountPercent: number;
    dealType: string;
    confidence: number;
    badge: string;
    reason: string;
  }>;
  meta: {
    currentAvgPrice: number;
    historicalAvgPrice: number;
    priceDropPercent: number;
    airlinesAnalyzed: string[];
    confidence: number;
  };
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
  destination: string;   // IATA
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

// --- RefundPolicy types ---

export interface AirlinePolicy {
  airline: string;
  airlineName: string;
  iata: string;
  changeFee: { domestic: number; sameDay: number; regular: number; note: string };
  cancellationFee: { refundable: number; nonRefundable: number; noShow: number };
  creditValidity: string;
  upgrades: { allowed: boolean; fee: number };
  baggage: { freeChecked: number; carryOn: number };
  flexScore: number;
  refundNote: string;
}

export interface RefundPolicyResult {
  airline: string;
  iata: string;
  flightNumber: string;
  route: string;
  departDate: string;
  policy: AirlinePolicy;
  changeOptions: {
    sameDayAllowed: boolean;
    sameDayFee: number;
    regularChangeFee: number;
    cancellationPenalty: number;
    refundEligible: boolean;
    creditValidDays: number;
  };
  warnings: string[];
  recommendation: string;
  flexScore: number;
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
}

// --- Hidden Destinations types ---

export interface HiddenDestinationResult {
  iata: string;
  city: string;
  country: string;
  region: string;
  distanceKm: number;
  estimatedPrice: number;
  hiddenScore: number;
  priceTier: number;
  touristiness: number;
  vibe: string;
  tagline: string;
  tags: string[];
  bestMonths: number[];
  searchVolume: 'low' | 'medium' | 'high';
  whyHidden: string;
  openJawPotential: string;
}

export interface HiddenDestinationsResponse {
  origin: string;
  analyzedAt: string;
  totalFound: number;
  destinations: HiddenDestinationResult[];
  meta: {
    topValuePicks: string[];
    offTheBeatenPath: string[];
    seasonalGems: string[];
  };
}