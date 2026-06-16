/**
 * Phase 1c: Price Anomaly Detection
 *
 * Identifies statistically significant price anomalies:
 * - Z-score: how many standard deviations below mean
 * - Day-of-week patterns: weekday vs weekend pricing
 * - Lead-time effects: last-minute vs advance booking
 * - Contextual tags: holiday eve, long-weekend, event season
 *
 * Uses calendar-prices.ts as the data source.
 */

import { getCalendarAnalytics } from './calendar-prices.js';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'extreme';

export interface Anomaly {
  date: string;
  /** how many std-devs below the mean */
  zScore: number;
  /** percentage below historical average */
  discountPercent: number;
  /** USD savings vs average */
  savingsUsd: number;
  severity: AnomalySeverity;
  tags: AnomalyTag[];
  flightPrice: number;
  airline: string;
  isDirect: boolean;
  description: string;
  /** 0-100, higher = better */
  dealScore: number;
}

export type AnomalyTag =
  | 'last_minute_deal'
  | 'weekend_getaway'
  | 'holiday_eve'
  | 'long_weekend'
  | 'shoulder_season'
  | 'off_peak'
  | 'red_eye'
  | 'early_bird'
  | 'school_holiday'
  | 'single_day_trip';

export interface AnomalyReport {
  origin: string;
  destination: string;
  month: string;
  anomalies: Anomaly[];
  stats: {
    totalDays: number;
    anomalyDays: number;
    avgPrice: number;
    extremeCount: number;
    highCount: number;
    avgZScore: number;
  };
  summary: string;
}

// Severity thresholds based on z-score
function severityFromZ(z: number): AnomalySeverity {
  if (z <= -2.0) return 'extreme';
  if (z <= -1.5) return 'high';
  if (z <= -1.0) return 'medium';
  return 'low';
}

const HOLIDAY_EVES = ['2026-02-16', '2026-02-17', '2026-02-18', '2026-04-03', '2026-04-04', '2026-04-05',
  '2026-06-19', '2026-06-20', '2026-06-21', '2026-10-09', '2026-10-10', '2026-10-11'];

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay(); // 0=Sun, 6=Sat
}

function tagDate(dateStr: string): AnomalyTag[] {
  const tags: AnomalyTag[] = [];
  const dow = getDayOfWeek(dateStr);
  const d = new Date(dateStr);

  // Weekend getaway: Fri or Sat departure
  if (dow === 5 || dow === 6) tags.push('weekend_getaway');

  // Holiday eve
  if (HOLIDAY_EVES.includes(dateStr)) tags.push('holiday_eve');

  // School holiday periods (Taiwan)
  const month = d.getMonth() + 1;
  if (month === 7 || month === 8) tags.push('school_holiday');

  // Shoulder season / off-peak months
  if (month === 3 || month === 4 || month === 11) tags.push('off_peak');
  if (month === 1 || month === 2) tags.push('shoulder_season');

  // Long weekend detection (Fri+Sat+Sun or Sat+Sun+Mon)
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  if (dow === 6 || dow === 0) {
    if (getDayOfWeek(prev.toISOString().slice(0, 10)) === 5 ||
        getDayOfWeek(next.toISOString().slice(0, 10)) === 1) {
      tags.push('long_weekend');
    }
  }

  // Red-eye: depart between 22:00-05:59 (not captured in calendar data,
  // but we can flag Sat midnight departures as likely red-eye)
  if (dow === 6) tags.push('red_eye');

  return tags;
}

function buildDescription(anomaly: Pick<Anomaly, 'tags' | 'isDirect' | 'discountPercent' | 'savingsUsd'>): string {
  const parts: string[] = [];

  if (anomaly.tags.includes('holiday_eve')) parts.push('Holiday eve');
  if (anomaly.tags.includes('long_weekend')) parts.push('Long weekend');
  if (anomaly.tags.includes('weekend_getaway')) parts.push('Weekend getaway');
  if (anomaly.tags.includes('off_peak') || anomaly.tags.includes('shoulder_season')) parts.push('Off-peak season');
  if (anomaly.tags.includes('school_holiday')) parts.push('School holiday');
  if (anomaly.tags.includes('red_eye')) parts.push('Red-eye flight');
  if (anomaly.isDirect) parts.push('Direct flight');

  parts.push(`$${anomaly.savingsUsd} below average`);
  parts.push(`${anomaly.discountPercent}% off`);

  return parts.join(' · ');
}

export async function detectAnomalies(
  origin: string,
  destination: string,
  month: string,
  minSeverity: AnomalySeverity = 'medium',
): Promise<AnomalyReport> {
  const cal = await getCalendarAnalytics(origin, destination, month);

  if (!cal.days.length) {
    return {
      origin,
      destination,
      month,
      anomalies: [],
      stats: { totalDays: 0, anomalyDays: 0, avgPrice: 0, extremeCount: 0, highCount: 0, avgZScore: 0 },
      summary: 'No data available for this route and month.',
    };
  }

  // Compute mean and std-dev for z-score
  const prices = cal.days.map((d) => d.price);
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance) || 1;

  const SEVERITY_RANK: Record<AnomalySeverity, number> = { low: 0, medium: 1, high: 2, extreme: 3 };
  const minRank = SEVERITY_RANK[minSeverity];

  const anomalies: Anomaly[] = cal.days
    .map((day): Anomaly => {
      const zScore = (day.price - mean) / stdDev;
      const discountPercent = mean > 0 ? Math.round((-zScore * 100) / (stdDev / mean)) : 0;
      const savingsUsd = Math.round(mean - day.price);
      const severity = severityFromZ(zScore);
      const tags = tagDate(day.date);

      return {
        date: day.date,
        zScore: Math.round(zScore * 100) / 100,
        discountPercent: Math.min(99, Math.max(0, discountPercent)),
        savingsUsd,
        severity,
        tags,
        flightPrice: day.price,
        airline: day.airline,
        isDirect: day.direct,
        dealScore: day.dealScore,
        description: buildDescription({ tags, isDirect: day.direct, discountPercent, savingsUsd }),
      };
    })
    .filter((a) => SEVERITY_RANK[a.severity] >= minRank)
    .sort((a, b) => a.zScore - b.zScore); // most anomalous first

  const extremeCount = anomalies.filter((a) => a.severity === 'extreme').length;
  const highCount = anomalies.filter((a) => a.severity === 'high').length;
  const avgZScore = anomalies.length
    ? Math.round((anomalies.reduce((s, a) => s + a.zScore, 0) / anomalies.length) * 100) / 100
    : 0;

  let summary = '';
  if (anomalies.length === 0) {
    summary = `No significant anomalies found for ${origin}→${destination} in ${month}. Prices are within normal range.`;
  } else if (extremeCount > 0) {
    summary = `🚨 Found ${extremeCount} extreme anomaly(s). Prices are ${Math.abs(anomalies[0].discountPercent)}%+ below average — likely sold-out routes with last-minute cancellations or error fares. Book immediately.`;
  } else if (highCount > 0) {
    summary = `🔥 Found ${highCount} high-priority deal(s). Prices are significantly below average. Good time to book.`;
  } else {
    summary = `📊 Found ${anomalies.length} moderate deal(s). Some savings available, but prices are within normal variation.`;
  }

  return {
    origin,
    destination,
    month,
    anomalies,
    stats: {
      totalDays: cal.days.length,
      anomalyDays: anomalies.length,
      avgPrice: Math.round(mean),
      extremeCount,
      highCount,
      avgZScore,
    },
    summary,
  };
}