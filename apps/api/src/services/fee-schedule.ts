// Airline ancillary fee schedules (USD)
// Sources: airline fee pages as of 2025-2026
// Key: airline IATA code

export interface FeeSchedule {
  airline: string;
  airlineName: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  checkedBag: {
    first: number;   // first bag fee (USD)
    second: number;   // second bag fee (USD)
    third?: number;
    included?: boolean; // true = included in ticket (default: false)
    weightLimit: number; // kg
  };
  carryOn: {
    fee: number;       // 0 = free
    sizeLimit: string; // e.g. "55x40x20cm"
    weightLimit: number; // kg
  };
  seatSelection: {
    standard: number;  // regular seat
    extraLegroom: number; // exit row / front
    preferred: number; // front of cabin
  };
  priorityBoarding: number; // USD
  meal: number;             // USD
  changeFee: number;        // USD (0 = not allowed)
  cancellationFee: number;  // USD (0 = no refund)
  wifi: number;             // USD (0 = free or not available)
}

// Comprehensive fee database for major Asia-Pacific airlines
export const AIRLINE_FEES: Record<string, FeeSchedule> = {
  // === Full-service carriers (generous inclusion) ===
  'BR': { // EVA Air
    airline: 'BR', airlineName: 'EVA Air',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 }, // 2pc included
    carryOn: { fee: 0, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 35, preferred: 35 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 100,
    cancellationFee: 200,
    wifi: 0,
  },
  'CI': { // China Airlines
    airline: 'CI', airlineName: 'China Airlines',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 40, preferred: 40 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 50,
    cancellationFee: 150,
    wifi: 0,
  },
  'JL': { // Japan Airlines
    airline: 'JL', airlineName: 'Japan Airlines',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x40x25cm', weightLimit: 10 },
    seatSelection: { standard: 0, extraLegroom: 45, preferred: 45 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 0,
    cancellationFee: 50,
    wifi: 0,
  },
  'NH': { // ANA
    airline: 'NH', airlineName: 'ANA',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x40x25cm', weightLimit: 10 },
    seatSelection: { standard: 0, extraLegroom: 50, preferred: 50 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 0,
    cancellationFee: 50,
    wifi: 0,
  },
  'CX': { // Cathay Pacific
    airline: 'CX', airlineName: 'Cathay Pacific',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 45, preferred: 45 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 70,
    cancellationFee: 120,
    wifi: 0,
  },
  'SQ': { // Singapore Airlines
    airline: 'SQ', airlineName: 'Singapore Airlines',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x40x23cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 50, preferred: 50 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 0,
    cancellationFee: 75,
    wifi: 0,
  },
  'OZ': { // Asiana
    airline: 'OZ', airlineName: 'Asiana Airlines',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x40x20cm', weightLimit: 10 },
    seatSelection: { standard: 0, extraLegroom: 40, preferred: 40 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 50,
    cancellationFee: 100,
    wifi: 0,
  },
  'KE': { // Korean Air
    airline: 'KE', airlineName: 'Korean Air',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x40x20cm', weightLimit: 12 },
    seatSelection: { standard: 0, extraLegroom: 45, preferred: 45 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 50,
    cancellationFee: 100,
    wifi: 0,
  },

  // === Low-cost carriers (charge for everything) ===
  'MM': { // Peach Aviation
    airline: 'MM', airlineName: 'Peach Aviation',
    cabinClass: 'economy',
    checkedBag: { first: 45, second: 65, weightLimit: 20 },
    carryOn: { fee: 35, sizeLimit: '55x40x25cm', weightLimit: 7 },
    seatSelection: { standard: 10, extraLegroom: 30, preferred: 25 },
    priorityBoarding: 30,
    meal: 15,
    changeFee: 45,
    cancellationFee: 65,
    wifi: 0,
  },
  '6J': { // StarFlyer
    airline: '6J', airlineName: 'StarFlyer',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 25, sizeLimit: '55x40x25cm', weightLimit: 7 },
    seatSelection: { standard: 8, extraLegroom: 25, preferred: 20 },
    priorityBoarding: 25,
    meal: 12,
    changeFee: 40,
    cancellationFee: 60,
    wifi: 0,
  },
  'TW': { // Tway Air
    airline: 'TW', airlineName: 'Tway Air',
    cabinClass: 'economy',
    checkedBag: { first: 50, second: 70, weightLimit: 15 },
    carryOn: { fee: 40, sizeLimit: '55x40x25cm', weightLimit: 7 },
    seatSelection: { standard: 8, extraLegroom: 28, preferred: 22 },
    priorityBoarding: 35,
    meal: 18,
    changeFee: 50,
    cancellationFee: 70,
    wifi: 0,
  },
  'LJ': { // Jin Air
    airline: 'LJ', airlineName: 'Jin Air',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '55x40x25cm', weightLimit: 10 },
    seatSelection: { standard: 8, extraLegroom: 25, preferred: 20 },
    priorityBoarding: 25,
    meal: 12,
    changeFee: 40,
    cancellationFee: 60,
    wifi: 0,
  },
  'BC': { // AirAsia X
    airline: 'BC', airlineName: 'AirAsia X',
    cabinClass: 'economy',
    checkedBag: { first: 55, second: 75, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 9, extraLegroom: 35, preferred: 28 },
    priorityBoarding: 40,
    meal: 15,
    changeFee: 55,
    cancellationFee: 80,
    wifi: 0,
  },
  'FD': { // AirAsia
    airline: 'FD', airlineName: 'AirAsia',
    cabinClass: 'economy',
    checkedBag: { first: 45, second: 65, weightLimit: 20 },
    carryOn: { fee: 25, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 7, extraLegroom: 30, preferred: 22 },
    priorityBoarding: 30,
    meal: 12,
    changeFee: 45,
    cancellationFee: 65,
    wifi: 0,
  },
  'Z2': { // Philippines AirAsia
    airline: 'Z2', airlineName: 'AirAsia Philippines',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 25, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 7, extraLegroom: 28, preferred: 20 },
    priorityBoarding: 28,
    meal: 12,
    changeFee: 40,
    cancellationFee: 60,
    wifi: 0,
  },
  'VZ': { // Thai Vietjet
    airline: 'VZ', airlineName: 'Thai Vietjet Air',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 25, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 6, extraLegroom: 25, preferred: 18 },
    priorityBoarding: 25,
    meal: 10,
    changeFee: 40,
    cancellationFee: 55,
    wifi: 0,
  },
  'SL': { // Thai Lion Air
    airline: 'SL', airlineName: 'Thai Lion Air',
    cabinClass: 'economy',
    checkedBag: { first: 45, second: 65, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '55x40x25cm', weightLimit: 7 },
    seatSelection: { standard: 8, extraLegroom: 28, preferred: 22 },
    priorityBoarding: 30,
    meal: 12,
    changeFee: 45,
    cancellationFee: 60,
    wifi: 0,
  },
  'TR': { // Scoot
    airline: 'TR', airlineName: 'Scoot',
    cabinClass: 'economy',
    checkedBag: { first: 45, second: 65, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '54x38x23cm', weightLimit: 7 },
    seatSelection: { standard: 10, extraLegroom: 35, preferred: 28 },
    priorityBoarding: 35,
    meal: 15,
    changeFee: 50,
    cancellationFee: 70,
    wifi: 0,
  },
  '7C': { // Jeju Air
    airline: '7C', airlineName: 'Jeju Air',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '55x40x25cm', weightLimit: 10 },
    seatSelection: { standard: 8, extraLegroom: 25, preferred: 20 },
    priorityBoarding: 25,
    meal: 12,
    changeFee: 40,
    cancellationFee: 60,
    wifi: 0,
  },
  'BX': { // Air Busan
    airline: 'BX', airlineName: 'Air Busan',
    cabinClass: 'economy',
    checkedBag: { first: 40, second: 60, weightLimit: 20 },
    carryOn: { fee: 30, sizeLimit: '55x40x25cm', weightLimit: 10 },
    seatSelection: { standard: 8, extraLegroom: 25, preferred: 20 },
    priorityBoarding: 25,
    meal: 12,
    changeFee: 40,
    cancellationFee: 55,
    wifi: 0,
  },
  'QH': { // Air Macau
    airline: 'QH', airlineName: 'Air Macau',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '56x36x23cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 30, preferred: 30 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 50,
    cancellationFee: 100,
    wifi: 0,
  },

  // === Middle East / Long-haul low-cost ===
  'EK': { // Emirates
    airline: 'EK', airlineName: 'Emirates',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '55x38x20cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 60, preferred: 60 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 110,
    cancellationFee: 160,
    wifi: 0,
  },
  'EY': { // Etihad
    airline: 'EY', airlineName: 'Etihad Airways',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '50x40x25cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 55, preferred: 55 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 100,
    cancellationFee: 140,
    wifi: 0,
  },
  'QR': { // Qatar Airways
    airline: 'QR', airlineName: 'Qatar Airways',
    cabinClass: 'economy',
    checkedBag: { first: 0, second: 0, weightLimit: 23 },
    carryOn: { fee: 0, sizeLimit: '50x37x25cm', weightLimit: 7 },
    seatSelection: { standard: 0, extraLegroom: 55, preferred: 55 },
    priorityBoarding: 0,
    meal: 0,
    changeFee: 90,
    cancellationFee: 130,
    wifi: 0,
  },
};

// ── Default (unknown airline) ──────────────────────────────────────────────
export const DEFAULT_FEES: FeeSchedule = {
  airline: '??', airlineName: 'Unknown Airline',
  cabinClass: 'economy',
  checkedBag: { first: 30, second: 50, weightLimit: 20 },
  carryOn: { fee: 20, sizeLimit: '55x40x25cm', weightLimit: 7 },
  seatSelection: { standard: 10, extraLegroom: 30, preferred: 25 },
  priorityBoarding: 25,
  meal: 15,
  changeFee: 75,
  cancellationFee: 100,
  wifi: 0,
};

export interface FeeBreakdown {
  airline: string;
  airlineName: string;
  baseFare: number;
  currency: string;
  fees: {
    checkedBag1: number;
    checkedBag2: number;
    carryOn: number;
    seatStandard: number;
    seatExtraLegroom: number;
    seatPreferred: number;
    priorityBoarding: number;
    meal: number;
    changeFee: number;
    cancellationFee: number;
    wifi: number;
  };
  totalBase: number;         // base fare only
  totalAllIn: number;         // base + likely addons (1 checked bag + std seat)
  totalFullyLoaded: number;  // base + all possible addons
  savingsVsFullService: number; // compared to typical full-service carrier
  hiddenFeeScore: number;    // 0=full service, 10=all-in cheap
  warnings: string[];
  recommendations: string[];
}

// Typical all-in cost for a full-service carrier on the same route
const FULL_SERVICE_BASELINE_USD = 180;

export function calculateTrueCost(
  airline: string,
  baseFare: number,
  passengers = 1,
  bagsEach = 1,
  seatType: 'none' | 'standard' | 'extra_legroom' | 'preferred' = 'standard',
  currency = 'USD',
): FeeBreakdown {
  const fees = AIRLINE_FEES[airline] ?? DEFAULT_FEES;

  const checkedBag1 = fees.checkedBag.included ? 0 : fees.checkedBag.first * bagsEach * passengers;
  const checkedBag2 = fees.checkedBag.included ? 0 : fees.checkedBag.second * bagsEach * passengers;
  const carryOn = fees.carryOn.fee * passengers;
  const seatStandard = seatType === 'none' ? 0 : seatType === 'standard' ? fees.seatSelection.standard * passengers : 0;
  const seatExtraLegroom = seatType === 'extra_legroom' ? fees.seatSelection.extraLegroom * passengers : 0;
  const seatPreferred = seatType === 'preferred' ? fees.seatSelection.preferred * passengers : 0;
  const priorityBoarding = fees.priorityBoarding * passengers;
  const meal = fees.meal * passengers;
  const changeFee = fees.changeFee * passengers;
  const cancellationFee = fees.cancellationFee * passengers;
  const wifi = fees.wifi;

  const totalBase = baseFare * passengers;
  const totalAllIn = totalBase
    + checkedBag1
    + carryOn
    + seatStandard
    + priorityBoarding
    + meal;

  const totalFullyLoaded = totalBase
    + checkedBag1
    + checkedBag2
    + carryOn
    + Math.max(seatStandard, seatExtraLegroom, seatPreferred)
    + priorityBoarding
    + meal
    + wifi;

  const hiddenFeeScore = fees.meal > 0
    ? Math.min(10, Math.round(((changeFee + cancellationFee + checkedBag1 + carryOn) / Math.max(baseFare, 1)) * 5))
    : 0;

  const warnings: string[] = [];
  if (!fees.checkedBag.included && baseFare < 100) {
    warnings.push(`⚠️ 托運行李需另外付費（第一件 $${fees.checkedBag.first}）`);
  }
  if (fees.carryOn.fee > 0 && baseFare < 80) {
    warnings.push(`⚠️ 隨身行李需另外付費（$${fees.carryOn.fee}）`);
  }
  if (fees.seatSelection.standard > 0) {
    warnings.push(`⚠️ 指定座位需另外付費（$${fees.seatSelection.standard} 起）`);
  }
  if (fees.priorityBoarding > 0) {
    warnings.push(`⚠️ 優先登機需另外付費（$${fees.priorityBoarding}）`);
  }
  if (fees.changeFee > 100) {
    warnings.push(`⚠️ 更改航班費用極高（$${fees.changeFee}）`);
  }
  if (fees.cancellationFee > 150) {
    warnings.push(`⚠️ 機票不可退款或費用極高（$${fees.cancellationFee}）`);
  }

  const recommendations: string[] = [];
  if (fees.checkedBag.included) recommendations.push('✅ 含托運行李，無隱藏費用');
  if (fees.carryOn.fee === 0) recommendations.push('✅ 隨身行李免費');
  if (fees.seatSelection.standard === 0) recommendations.push('✅ 無需額外付費選位');
  if (fees.meal === 0) recommendations.push('✅ 含機上餐點');
  if (fees.wifi === 0) recommendations.push('✅ 機上 WiFi 免費');
  if (fees.changeFee === 0) recommendations.push('✅ 免費更改航班');

  const savingsVsFullService = Math.max(0, Math.round(
    ((totalAllIn - FULL_SERVICE_BASELINE_USD * passengers) / (totalAllIn)) * 100,
  ));

  return {
    airline: fees.airline,
    airlineName: fees.airlineName,
    baseFare,
    currency,
    fees: {
      checkedBag1,
      checkedBag2,
      carryOn,
      seatStandard,
      seatExtraLegroom,
      seatPreferred,
      priorityBoarding,
      meal,
      changeFee,
      cancellationFee,
      wifi,
    },
    totalBase,
    totalAllIn,
    totalFullyLoaded,
    savingsVsFullService: Math.max(0, savingsVsFullService),
    hiddenFeeScore,
    warnings,
    recommendations,
  };
}