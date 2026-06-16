/**
 * Flight Decision Board Service
 *
 * Combines fee breakdown, refund policy, and promotion data into a single
 * decision recommendation for a given route + airline.
 * This is the user's final "should I book this?" answer.
 */

import { calculateTrueCost } from './fee-schedule.js';
import { analyzeRefundPolicy } from './refund-policy.js';
import { analyzePromotions, type PromotionAnalysis } from './promotion-detector.js';
import type { RefundPolicyResult } from '../types/index.js';

const TWD_RATE = 32;

export interface DecisionBoardResult {
  route: string;
  departDate: string;
  airline: string;
  iata: string;
  analyzedAt: string;
  // True cost breakdown
  cost: {
    baseFare: number;
    currency: string;
    allInWithExtras: number;   // base + 1 checked bag + standard seat
    fullyLoaded: number;       // base + all possible addons
    extrasTotal: number;        // allInWithExtras - baseFare
    hiddenFeeScore: number;     // 0=full service, 10=all-in cheap
    warnings: string[];
    recommendations: string[];
  };
  // Refund/change policy
  policy: RefundPolicyResult;
  // Promotions
  promotions: {
    hasActivePromotion: boolean;
    priceDropPercent: number;
    currentAvgPrice: number;
    historicalAvgPrice: number;
    confidence: number;
    dealCount: number;
  };
  // Overall verdict
  verdict: {
    score: number; // 0-100
    recommendation: 'book_now' | 'wait' | 'consider_alternatives';
    summary: string;
    reasons: string[];
    riskFactors: string[];
  };
}

export async function getFlightDecision(
  origin: string,
  destination: string,
  departDate: string,
  airline: string,
  iata: string,
  baseFare: number,
  passengers = 1,
): Promise<DecisionBoardResult> {
  const month = departDate.slice(0, 7); // YYYY-MM for analyzePromotions

  const [costResult, policyResult, promoResult]: [ReturnType<typeof calculateTrueCost>, RefundPolicyResult, PromotionAnalysis] =
    await Promise.all([
      Promise.resolve(calculateTrueCost(iata, baseFare, Math.max(1, Math.min(9, passengers)))),
      Promise.resolve(analyzeRefundPolicy(airline, iata, '—', `${origin}→${destination}`, departDate)),
      analyzePromotions(origin, destination, month),
    ]);

  const extrasTotal = Math.max(0, costResult.totalAllIn - costResult.totalBase);
  const { hasActivePromotion, meta } = promoResult;
  const { priceDropPercent, currentAvgPrice, historicalAvgPrice, confidence } = meta;

  const reasons: string[] = [];
  const riskFactors: string[] = [];

  if (hasActivePromotion) {
    const estimatedSavingTwd = Math.round(priceDropPercent / 100 * currentAvgPrice * TWD_RATE);
    reasons.push(`目前有促銷活動，平均降價 ${priceDropPercent.toFixed(0)}%，估計每人省 NT$${estimatedSavingTwd}`);
  }
  if ((policyResult.flexScore ?? 0) >= 8) {
    reasons.push('航空公司靈活度高，改票/退票政策友善');
  }
  if (costResult.hiddenFeeScore <= 3) {
    reasons.push('無隱藏附加費，標價等於實際成本');
  }

  if (policyResult.changeOptions.cancellationPenalty > 150) {
    riskFactors.push('取消罰則較高 (>$150 USD)');
  }
  if (extrasTotal > 80) {
    riskFactors.push(`隱藏附加費用較高 ($${extrasTotal}/人)`);
  }
  if (!hasActivePromotion && priceDropPercent < 5) {
    riskFactors.push('目前無促銷，價格並非最低點');
  }
  if (currentAvgPrice > historicalAvgPrice * 1.1) {
    riskFactors.push('目前價格高於歷史平均，建議觀望');
  }

  // Score: base 50, adjustments
  let score = 50;
  if (hasActivePromotion) score += 20;
  if ((policyResult.flexScore ?? 0) >= 7) score += 15;
  if (costResult.hiddenFeeScore <= 2) score += 10;
  if (extrasTotal < 30) score += 5;
  if (policyResult.changeOptions.cancellationPenalty < 80) score += 5;
  if (policyResult.changeOptions.cancellationPenalty > 200) score -= 15;
  if (!hasActivePromotion && priceDropPercent < 5) score -= 5;
  if (currentAvgPrice > historicalAvgPrice * 1.15) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const recommendation = score >= 75 ? 'book_now' : score >= 55 ? 'wait' : 'consider_alternatives';

  const summaryMap: Record<string, string> = {
    book_now: `建議立刻預訂。綜合評分 ${score}/100，優惠結合靈活政策，性價比高。`,
    wait: `可以再觀望。評分 ${score}/100，目前價格合理但尚有優化空間。`,
    consider_alternatives: `建議多方比較。評分 ${score}/100，該航班性價比非最佳，建議看看其他日期或航空公司。`,
  };

  return {
    route: `${origin}→${destination}`,
    departDate,
    airline,
    iata,
    analyzedAt: new Date().toISOString(),
    cost: {
      baseFare: costResult.totalBase,
      currency: 'USD',
      allInWithExtras: costResult.totalAllIn,
      fullyLoaded: costResult.totalFullyLoaded,
      extrasTotal,
      hiddenFeeScore: costResult.hiddenFeeScore,
      warnings: costResult.warnings,
      recommendations: costResult.recommendations,
    },
    policy: policyResult,
    promotions: {
      hasActivePromotion,
      priceDropPercent,
      currentAvgPrice,
      historicalAvgPrice,
      confidence,
      dealCount: promoResult.deals.length,
    },
    verdict: {
      score,
      recommendation,
      summary: summaryMap[recommendation],
      reasons,
      riskFactors,
    },
  };
}