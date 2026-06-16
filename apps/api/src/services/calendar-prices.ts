import { getCalendarPrices } from './travelpayouts.js';

export interface CalendarAnalytics {
  date: string;
  price: number;
  airline: string;
  stops: number;
  direct: boolean;
  /** percentile rank 0-100, lower = cheaper */
  rank: number;
  /** true if price ≤ 70% of average */
  isHot: boolean;
  /** true if this is the single cheapest day */
  isCheapest: boolean;
  /** savings vs average (USD), can be negative */
  savingsVsAvg: number;
  /** savings vs average (%), e.g. -28 means 28% below average */
  savingsPercent: number;
  /** deal score 0-100, higher = better deal */
  dealScore: number;
}

export interface CalendarResult {
  origin: string;
  destination: string;
  month: string; // YYYY-MM
  days: CalendarAnalytics[];
  stats: {
    daysAnalyzed: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
  };
  cheapest: CalendarAnalytics;
  secondCheapest?: CalendarAnalytics;
  /** days where isHot === true */
  hotDays: CalendarAnalytics[];
}

const HOT_THRESHOLD = 0.70; // price ≤ 70% of average → "Hot"
const DEAL_WEIGHT_PRICE = 0.6;
const DEAL_WEIGHT_DIRECT = 0.4;

function calcDealScore(price: number, avgPrice: number, direct: boolean): number {
  const priceScore = Math.max(0, 1 - price / avgPrice) * 100;
  const directBonus = direct ? 20 : 0;
  return Math.min(100, Math.round(priceScore * DEAL_WEIGHT_PRICE + directBonus * DEAL_WEIGHT_DIRECT));
}

export async function getCalendarAnalytics(
  origin: string,
  destination: string,
  month: string,
): Promise<CalendarResult> {
  const { dates } = await getCalendarPrices(origin, destination, month);

  if (!dates.length) {
    return {
      origin,
      destination,
      month,
      days: [],
      stats: { daysAnalyzed: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, medianPrice: 0 },
      cheapest: {} as CalendarAnalytics,
      hotDays: [],
    };
  }

  const sortedByPrice = [...dates].sort((a, b) => a.price - b.price);
  const prices = sortedByPrice.map((d) => d.price);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
  const medianPrice = prices[Math.floor(prices.length / 2)];

  // percentile rank: (index / (len-1)) * 100, sorted ascending
  const days: CalendarAnalytics[] = sortedByPrice.map((d, idx) => {
    const rank = prices.length === 1 ? 0 : Math.round((idx / (prices.length - 1)) * 100);
    const savingsVsAvg = Math.round(avgPrice - d.price);
    const savingsPercent = avgPrice > 0 ? Math.round((-savingsVsAvg / avgPrice) * 100) : 0;
    return {
      date: d.date,
      price: d.price,
      airline: d.airline,
      stops: d.stops,
      direct: d.stops === 0,
      rank,
      isHot: d.price <= avgPrice * HOT_THRESHOLD,
      isCheapest: idx === 0,
      savingsVsAvg,
      savingsPercent,
      dealScore: calcDealScore(d.price, avgPrice, d.stops === 0),
    };
  });

  const cheapest = days[0];
  const secondCheapest = days[1];
  const hotDays = days.filter((d) => d.isHot);

  return {
    origin,
    destination,
    month,
    days,
    stats: { daysAnalyzed: dates.length, avgPrice: Math.round(avgPrice), minPrice, maxPrice, medianPrice },
    cheapest,
    secondCheapest,
    hotDays,
  };
}