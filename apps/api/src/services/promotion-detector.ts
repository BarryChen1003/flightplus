interface PromotionDeal {
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
}

// Common airline pricing patterns for deal detection
const AIRLINE_BASELINES: Record<string, number> = {
  // Taiwan carriers (USD)
  BR: 180, // EVA Air
  CI: 175, // China Airlines
  AE: 120, // Mandarin (simulated)
  // Japanese carriers
  NH: 160, // ANA
  JL: 155, // Japan Airlines
  GK: 85,  // Peach (budget)
  IJ: 80,  // Spring (budget)
  // HK/CN carriers
  CX: 150, // Cathay
  KA: 130, // Hong Kong Airlines
  MU: 90,  // China Eastern
  CA: 95,  // Air China
  // Korean
  KE: 140, // Korean Air
  LJ: 100, // Jin Air
  // Singapore
  SQ: 200, // Singapore Airlines
  TR: 80,  // Scoot
};

// Seasonal adjustment factors
function getSeasonalMultiplier(month: number): number {
  // Peak: Jul-Aug (1.3), Dec-Jan (1.25), CNY (1.35)
  // Off-peak: Feb (0.85), Nov (0.9), Sep-Oct (0.88)
  const factors: Record<number, number> = {
    1: 1.25, 2: 0.85, 3: 1.0, 4: 1.05, 5: 1.1, 6: 1.15,
    7: 1.3, 8: 1.3, 9: 0.88, 10: 0.9, 11: 0.9, 12: 1.25,
  };
  return factors[month] ?? 1.0;
}

// Weekend premium factors
function getDayPremium(dayOfWeek: number): number {
  // Fri-Sun premium, Tue-Wed discount
  const premiums: Record<number, number> = {
    0: 1.15, // Sun
    1: 0.95, // Mon
    2: 0.88, // Tue
    3: 0.90, // Wed
    4: 0.93, // Thu
    5: 1.20, // Fri
    6: 1.25, // Sat
  };
  return premiums[dayOfWeek] ?? 1.0;
}

function detectPromotions(
  _origin: string,
  _destination: string,
  month: string, // YYYY-MM
): PromotionDeal[] {
  const deals: PromotionDeal[] = [];
  const [y, m] = month.split('-').map(Number);
  const seasonMult = getSeasonalMultiplier(m);

  // Build expected price per airline
  for (const [airline, basePrice] of Object.entries(AIRLINE_BASELINES)) {
    const expectedPrice = Math.round(basePrice * seasonMult);

    // Simulate daily variations to find "deals"
    for (let day = 1; day <= 28; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, day).getDay();
      const dayMult = getDayPremium(dow);

      // Simulated current price with some randomness
      const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      const currentPrice = Math.round(expectedPrice * dayMult * variance);

      // A deal: current price significantly below expected
      const discountPct = Math.round(((expectedPrice - currentPrice) / expectedPrice) * 100);

      if (discountPct >= 15) {
        const dealTypes = [
          { min: 25, badge: "🔥 閃促", type: "flash_sale" },
          { min: 20, badge: "⚡ 限時", type: "limited" },
          { min: 15, badge: "💰 特惠", type: "promotion" },
        ];
        const tier = dealTypes.find((t) => discountPct >= t.min) ?? dealTypes[2];

        deals.push({
          airline: airline === 'BR' ? 'EVA Air' :
                   airline === 'CI' ? 'China Airlines' :
                   airline === 'GK' ? 'Peach Aviation' :
                   airline === 'CX' ? 'Cathay Pacific' :
                   airline,
          price: currentPrice,
          currency: 'USD',
          departureDate: dateStr,
          originalPrice: Math.round(currentPrice / (1 - discountPct / 100)),
          discountPercent: discountPct,
          dealType: tier.type,
          confidence: Math.min(0.95, 0.5 + discountPct / 100),
          badge: tier.badge,
          reason: `較正常價省 $${Math.round(expectedPrice * discountPct / 100)}（${discountPct}% off）`,
        });
      }
    }
  }

  // Sort by discount descending
  deals.sort((a, b) => b.discountPercent - a.discountPercent);
  return deals.slice(0, 20);
}

export interface PromotionAnalysis {
  origin: string;
  destination: string;
  analyzedAt: string;
  hasActivePromotion: boolean;
  deals: PromotionDeal[];
  meta: {
    currentAvgPrice: number;
    historicalAvgPrice: number;
    priceDropPercent: number;
    airlinesAnalyzed: string[];
    confidence: number;
  };
}

export async function analyzePromotions(
  origin: string,
  destination: string,
  month: string,
): Promise<PromotionAnalysis> {
  const deals = detectPromotions(origin, destination, month);

  const airlinesAnalyzed = [...new Set(deals.map((d) => d.airline))];
  const hasActivePromotion = deals.length > 0;

  const currentPrices = deals.map((d) => d.price);
  const currentAvgPrice = currentPrices.length > 0
    ? Math.round(currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length)
    : 0;

  // Historical average: slightly above current (assuming deals are ~15-30% below)
  const avgDealDiscount = deals.length > 0
    ? deals.reduce((s, d) => s + d.discountPercent, 0) / deals.length
    : 10;
  const historicalAvgPrice = Math.round(currentAvgPrice / (1 - avgDealDiscount / 100));
  const priceDropPercent = historicalAvgPrice > 0
    ? Math.round(((historicalAvgPrice - currentAvgPrice) / historicalAvgPrice) * 100)
    : 0;

  return {
    origin,
    destination,
    analyzedAt: new Date().toISOString(),
    hasActivePromotion,
    deals: deals.slice(0, 10),
    meta: {
      currentAvgPrice,
      historicalAvgPrice,
      priceDropPercent,
      airlinesAnalyzed,
      confidence: deals.length > 5 ? 0.85 : deals.length > 2 ? 0.7 : 0.5,
    },
  };
}