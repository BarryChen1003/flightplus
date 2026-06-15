/**
 * Airline Refund & Change Policy Service
 *
 * Provides policy analysis for flight changes/cancellations across carriers.
 * Covers Taiwan, Japan, Korea, SE Asia, and major international carriers.
 */

// --- Known Policy Database (USD) ---

interface AirlinePolicy {
  airline: string;
  airlineName: string;
  iata: string;
  changeFee: {
    domestic: number;
    sameDay: number;
    regular: number;
    note: string;
  };
  cancellationFee: {
    refundable: number;
    nonRefundable: number;
    noShow: number;
  };
  creditValidity: string;
  upgrades: {
    allowed: boolean;
    fee: number;
  };
  baggage: {
    freeChecked: number;
    carryOn: number;
  };
  flexScore: number; // 0-10, higher = more flexible
  refundNote: string;
}

export const AIRLINE_POLICIES: AirlinePolicy[] = [
  // --- Taiwan ---
  {
    airline: 'EVA Air',
    airlineName: '長榮航空',
    iata: 'BR',
    changeFee: { domestic: 50, sameDay: 30, regular: 0, note: ' Brilliance 取消/改期免手續費（官網購票）' },
    cancellationFee: { refundable: 0, nonRefundable: 100, noShow: 150 },
    creditValidity: '機票有效期內， credit 可保留 1 年',
    upgrades: { allowed: true, fee: 100 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 8,
    refundNote: 'Refundable ticket: 全額退款。 Non-refundable: 扣除罰金後退還稅金及未用過的 fees。',
  },
  {
    airline: 'China Airlines',
    airlineName: '中華航空',
    iata: 'CI',
    changeFee: { domestic: 50, sameDay: 30, regular: 0, note: '官網購票改期免手續費（效期內）' },
    cancellationFee: { refundable: 0, nonRefundable: 100, noShow: 150 },
    creditValidity: '1 年，機票效期內',
    upgrades: { allowed: true, fee: 100 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 8,
    refundNote: 'Refundable ticket 全額。 Non-refundable 扣除罰金後退還稅金。',
  },
  {
    airline: 'Starlux Airlines',
    airlineName: '星宇航空',
    iata: 'JX',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: '全程免費改票（首年限定優惠）' },
    cancellationFee: { refundable: 0, nonRefundable: 50, noShow: 100 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 80 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 10,
    refundNote: '新創航空公司，政策非常靈活，旅客友善。',
  },
  {
    airline: 'Tigerair Taiwan',
    airlineName: '台灣虎航',
    iata: 'IT',
    changeFee: { domestic: 60, sameDay: 40, regular: 60, note: 'LCC：改票收取差價+手續費' },
    cancellationFee: { refundable: 0, nonRefundable: 100, noShow: 150 },
    creditValidity: '僅提供 credit，效期 3 個月',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 0, carryOn: 1 },
    flexScore: 3,
    refundNote: 'LCC，機票不可退款，只能轉換 credit 且效期短。',
  },
  // --- Japan ---
  {
    airline: 'Peach Aviation',
    airlineName: '樂桃航空',
    iata: 'MM',
    changeFee: { domestic: 40, sameDay: 0, regular: 40, note: 'LCC，改票收差價+¥1,000' },
    cancellationFee: { refundable: 0, nonRefundable: 100, noShow: 150 },
    creditValidity: '90 天 credit',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 0, carryOn: 1 },
    flexScore: 2,
    refundNote: 'LCC，不可退款，credit 效期短，政策嚴格。',
  },
  {
    airline: 'ANA',
    airlineName: '全日空',
    iata: 'NH',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: 'Flex 票種全程免費，普通票種免費' },
    cancellationFee: { refundable: 0, nonRefundable: 50, noShow: 100 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 80 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 8,
    refundNote: 'Flex 票完全靈活，普通票可免費改票但退款限制多。',
  },
  {
    airline: 'Japan Airlines',
    airlineName: '日本航空',
    iata: 'JL',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: '官网购票免手续费' },
    cancellationFee: { refundable: 0, nonRefundable: 50, noShow: 100 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 80 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 8,
    refundNote: 'Flex 票完全靈活，普通票退款需扣除手續費。',
  },
  {
    airline: 'Spring Airlines Japan',
    airlineName: '春秋航空日本',
    iata: 'IJ',
    changeFee: { domestic: 50, sameDay: 30, regular: 50, note: 'LCC' },
    cancellationFee: { refundable: 0, nonRefundable: 100, noShow: 150 },
    creditValidity: '30 天 credit（極短）',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 0, carryOn: 1 },
    flexScore: 2,
    refundNote: 'LCC，credit 效期僅 30 天，非常嚴格。',
  },
  // --- Korea ---
  {
    airline: 'Korean Air',
    airlineName: '大韓航空',
    iata: 'KE',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: ' Economy Lite 以外皆免費' },
    cancellationFee: { refundable: 0, nonRefundable: 120, noShow: 200 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 80 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 7,
    refundNote: 'Economy Lite 不可退款、不可改票。標準票靈活。',
  },
  {
    airline: 'Jin Air',
    airlineName: '真航空',
    iata: 'LJ',
    changeFee: { domestic: 40, sameDay: 20, regular: 40, note: 'LCC-mixed' },
    cancellationFee: { refundable: 0, nonRefundable: 80, noShow: 120 },
    creditValidity: '6 個月',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 1, carryOn: 1 },
    flexScore: 4,
    refundNote: '介於傳統航空與 LCC 之间，有部分靈活性。',
  },
  // --- SE Asia ---
  {
    airline: 'Singapore Airlines',
    airlineName: '新加坡航空',
    iata: 'SQ',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: '官網購票免費改票' },
    cancellationFee: { refundable: 0, nonRefundable: 75, noShow: 120 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 100 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 8,
    refundNote: '標準靈活，最低价票（Lite）限制多。',
  },
  {
    airline: 'Scoot',
    airlineName: '酷航',
    iata: 'TR',
    changeFee: { domestic: 45, sameDay: 25, regular: 45, note: 'LCC，改票收差價+手續費' },
    cancellationFee: { refundable: 0, nonRefundable: 90, noShow: 130 },
    creditValidity: '90 天 credit',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 0, carryOn: 1 },
    flexScore: 2,
    refundNote: 'LCC，機票不可退款，credit 效期 90 天。',
  },
  {
    airline: 'Cathay Pacific',
    airlineName: '國泰航空',
    iata: 'CX',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: '經濟艙特價票以外免費' },
    cancellationFee: { refundable: 0, nonRefundable: 70, noShow: 120 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 80 },
    baggage: { freeChecked: 2, carryOn: 1 },
    flexScore: 7,
    refundNote: '特價票（Basic）不可退款，普通經濟艙免費改票。',
  },
  {
    airline: 'AirAsia',
    airlineName: '亞洲航空',
    iata: 'AK',
    changeFee: { domestic: 35, sameDay: 20, regular: 35, note: 'LCC' },
    cancellationFee: { refundable: 0, nonRefundable: 85, noShow: 120 },
    creditValidity: '60 天 credit',
    upgrades: { allowed: false, fee: 0 },
    baggage: { freeChecked: 0, carryOn: 1 },
    flexScore: 2,
    refundNote: 'LCC，無退款，僅 credit，效期 60 天。',
  },
  {
    airline: 'Vietnam Airlines',
    airlineName: '越南航空',
    iata: 'VN',
    changeFee: { domestic: 30, sameDay: 20, regular: 30, note: 'Economy Lite 不可改' },
    cancellationFee: { refundable: 0, nonRefundable: 80, noShow: 120 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 60 },
    baggage: { freeChecked: 1, carryOn: 1 },
    flexScore: 5,
    refundNote: 'Economy Lite 不可改票不退費，Standard 較靈活。',
  },
  // --- US / International ---
  {
    airline: 'Delta Air Lines',
    airlineName: '達美航空',
    iata: 'DL',
    changeFee: { domestic: 0, sameDay: 0, regular: 0, note: '2024 已取消改票手續費（Basic Econ 除外）' },
    cancellationFee: { refundable: 0, nonRefundable: 0, noShow: 75 },
    creditValidity: '1 年，經 Delta Credit 形式',
    upgrades: { allowed: true, fee: 0 },
    baggage: { freeChecked: 1, carryOn: 1 },
    flexScore: 9,
    refundNote: '2024 年起除 Basic Economy 外全面取消改票/退票手續費。',
  },
  {
    airline: 'United Airlines',
    airlineName: '聯合航空',
    iata: 'UA',
    changeFee: { domestic: 0, sameDay: 75, regular: 0, note: 'Basic Economy 不可改，其他免費' },
    cancellationFee: { refundable: 0, nonRefundable: 0, noShow: 100 },
    creditValidity: '1 年',
    upgrades: { allowed: true, fee: 0 },
    baggage: { freeChecked: 1, carryOn: 1 },
    flexScore: 8,
    refundNote: 'Basic Economy 完全限制，其他艙等免費改票/退款。',
  },
];

// --- Types ---

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

// --- Helpers ---

export function getAirlineByIata(iata: string): AirlinePolicy | undefined {
  return AIRLINE_POLICIES.find((p) => p.iata === iata.toUpperCase());
}

export function getChangeabilityRating(policy: AirlinePolicy): RefundPolicyResult['overallRating'] {
  if (policy.flexScore >= 8) return 'excellent';
  if (policy.flexScore >= 6) return 'good';
  if (policy.flexScore >= 4) return 'fair';
  return 'poor';
}

// --- Main Analysis Function ---

export function analyzeRefundPolicy(
  airline: string,
  iata: string,
  flightNumber: string,
  route: string,
  departDate: string,
): RefundPolicyResult {
  const policy = getAirlineByIata(iata);
  const airlineName = policy?.airline ?? airline;

  // Fallback for unknown airlines
  if (!policy) {
    return {
      airline: airlineName,
      iata: iata.toUpperCase(),
      flightNumber,
      route,
      departDate,
      policy: {
        airline: airlineName,
        airlineName: airlineName,
        iata: iata.toUpperCase(),
        changeFee: { domestic: 100, sameDay: 50, regular: 100, note: '未知政策，請查閱官網' },
        cancellationFee: { refundable: 50, nonRefundable: 150, noShow: 200 },
        creditValidity: '未知',
        upgrades: { allowed: false, fee: 0 },
        baggage: { freeChecked: 0, carryOn: 1 },
        flexScore: 5,
        refundNote: '未知航空公司，請直接聯繫航空公司確認。',
      },
      changeOptions: {
        sameDayAllowed: false,
        sameDayFee: 50,
        regularChangeFee: 100,
        cancellationPenalty: 150,
        refundEligible: false,
        creditValidDays: 90,
      },
      warnings: ['航空公司政策數據不完整，強烈建議直接查詢官網或致電航空公司'],
      recommendation: '未知政策，出發前請務必與航空公司確認最新變更/退款規定。',
      flexScore: 5,
      overallRating: 'fair',
    };
  }

  const warnings: string[] = [];

  if (policy.changeFee.regular > 80) {
    warnings.push(`${airlineName} 改票手續費偏高（$${policy.changeFee.regular}），建議確認行程再購票`);
  }
  if (policy.cancellationFee.nonRefundable > 80) {
    warnings.push(`${airlineName} 非退款機票退票罰金高（$${policy.cancellationFee.nonRefundable}），如有可能變更計畫建議購退款型機票`);
  }
  if (policy.changeFee.regular === 0) {
    warnings.push(`✅ ${airlineName} 改票免手續費，行程彈性高`);
  }
  if (policy.cancellationFee.refundable === 0) {
    warnings.push(`✅ ${airlineName} 標準機票支持退款，適合行程未定旅客`);
  }
  if (policy.upgrades.allowed) {
    warnings.push(`可付費升等（$${policy.upgrades.fee} 起）`);
  }
  if (policy.baggage.freeChecked === 0) {
    warnings.push(`${airlineName} 無免費托運行李，需額外購買`);
  }

  // Days until departure context
  const daysUntil = Math.ceil((new Date(departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7 && daysUntil > 0) {
    warnings.push(`⚠️ 出發前 ${daysUntil} 天內，當日或特價票可能不允許變更`);
  }
  if (daysUntil <= 3 && daysUntil > 0) {
    warnings.push(`⛔ 出發前 72 小時內，多數航空公司不允許變更或退票`);
  }

  let recommendation = '';
  if (policy.flexScore >= 8) {
    recommendation = `✅ ${airlineName} 政策非常靈活——免費改票、支持退款，適合行程可能變更的旅客。建議選擇 Standard 或 Flex 票種。`;
  } else if (policy.flexScore >= 5) {
    recommendation = `⚠️ ${airlineName} 政策適中，有部分限制。建議預留 USD $${policy.changeFee.regular + 50} 作為潛在變更預算，並購買旅遊保險。`;
  } else {
    recommendation = `⚠️ ${airlineName} 為低成本航空公司，政策嚴格（不可退款、不可改票或手續費高）。強烈建議購買旅遊保險並確認行程後再購票。`;
  }

  const creditValidDays = parseInt(policy.creditValidity) || 365;

  return {
    airline: policy.airline,
    iata: policy.iata,
    flightNumber,
    route,
    departDate,
    policy,
    changeOptions: {
      sameDayAllowed: policy.changeFee.sameDay < policy.changeFee.regular,
      sameDayFee: policy.changeFee.sameDay,
      regularChangeFee: policy.changeFee.regular,
      cancellationPenalty: policy.cancellationFee.nonRefundable,
      refundEligible: policy.cancellationFee.refundable === 0,
      creditValidDays,
    },
    warnings,
    recommendation,
    flexScore: policy.flexScore,
    overallRating: getChangeabilityRating(policy),
  };
}

// --- Compare Multiple Airlines ---

export function compareAirlinePolicies(iataList: string[]): RefundPolicyResult[] {
  return iataList
    .map((iata) => analyzeRefundPolicy(iata, iata, '—', '—', new Date().toISOString().slice(0, 10)))
    .sort((a, b) => b.flexScore - a.flexScore);
}

// --- Score Route Flexibility ---

export function scoreRouteFlexibility(
  airlines: Array<{ iata: string; price: number }>,
): {
  bestForFlexibility: string;
  bestForPrice: string;
  bestOverall: string;
  comparison: Array<{ iata: string; price: number; flexScore: number; valueScore: number }>;
} {
  const maxPrice = Math.max(...airlines.map((a) => a.price));

  const comparison = airlines.map((a) => {
    const policy = getAirlineByIata(a.iata);
    const flexScore = policy?.flexScore ?? 5;
    const priceScore = Math.round(((maxPrice - a.price) / maxPrice) * 10);
    const valueScore = Math.round((flexScore + priceScore) / 2);
    return {
      iata: a.iata,
      price: a.price,
      flexScore,
      valueScore,
    };
  });

  comparison.sort((a, b) => b.valueScore - a.valueScore);

  return {
    bestForFlexibility: comparison[0]?.iata ?? '',
    bestForPrice: [...comparison].sort((a, b) => a.price - b.price)[0]?.iata ?? '',
    bestOverall: comparison[0]?.iata ?? '',
    comparison,
  };
}