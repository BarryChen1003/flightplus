/**
 * Phase 1b: Flight + Hotel Package Builder (Mock)
 *
 * Logic: Given a destination city, generate realistic mock hotels.
 * Package price = flight + (hotel price/night × nights).
 * Compare: "buy package together" vs "book flight + hotel separately".
 *
 * Real hotel data will come from TravelPayouts Hotels API (Phase 2).
 * This mock establishes the complete product logic and API contract.
 */

// Reasonable mock hotel price ranges by destination region (USD/night, 2-star to 5-star)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_HOTELS: Record<string, any[]> = {
  DEFAULT: [
    { name: '城市商務飯店', stars: 3, pricePerNight: 45 },
    { name: '優質商務酒店', stars: 4, pricePerNight: 85 },
    { name: '五星級都會飯店', stars: 5, pricePerNight: 160 },
    { name: '機場過境飯店', stars: 3, pricePerNight: 38 },
    { name: '膠囊航空飯店', stars: 2, pricePerNight: 22 },
  ],
  Tokyo: [
    { name: '新宿格蘭城市飯店', stars: 3, pricePerNight: 65 },
    { name: '東京王子大飯店', stars: 4, pricePerNight: 120 },
    { name: '帝國飯店 Tokyo', stars: 5, pricePerNight: 280 },
    { name: '成田機場日航酒店', stars: 4, pricePerNight: 95 },
    { name: '膠囊旅館First Cabin', stars: 2, pricePerNight: 35 },
  ],
  Osaka: [
    { name: '心齋橋法拉姆飯店', stars: 3, pricePerNight: 55 },
    { name: '大阪帝國飯店', stars: 4, pricePerNight: 100 },
    { name: '瑞茲大阪酒店', stars: 5, pricePerNight: 220 },
    { name: '關西機場日航酒店', stars: 4, pricePerNight: 90 },
    { name: '大阪膠囊飯店', stars: 2, pricePerNight: 28 },
  ],
  Seoul: [
    { name: '明洞城市飯店', stars: 3, pricePerNight: 50 },
    { name: '首爾皇家酒店', stars: 4, pricePerNight: 95 },
    { name: '新羅酒店', stars: 5, pricePerNight: 200 },
    { name: '仁川機場飯店', stars: 4, pricePerNight: 80 },
    { name: '弘大膠囊旅館', stars: 2, pricePerNight: 25 },
  ],
  Bangkok: [
    { name: '是隆商務飯店', stars: 3, pricePerNight: 28 },
    { name: '曼谷香格里拉', stars: 5, pricePerNight: 130 },
    { name: '水門伯克利酒店', stars: 4, pricePerNight: 55 },
    { name: '素萬那普機場酒店', stars: 3, pricePerNight: 35 },
    { name: '考山路背包客棧', stars: 2, pricePerNight: 12 },
  ],
  Singapore: [
    { name: '武吉士萊佛士坊飯店', stars: 3, pricePerNight: 90 },
    { name: '新加坡香格里拉', stars: 5, pricePerNight: 320 },
    { name: '濱海灣金沙', stars: 5, pricePerNight: 450 },
    { name: '星耀樟宜酒店', stars: 4, pricePerNight: 140 },
    { name: '克拉碼頭飯店', stars: 4, pricePerNight: 110 },
  ],
  Taipei: [
    { name: '西門町城市飯店', stars: 3, pricePerNight: 50 },
    { name: '台北君悅酒店', stars: 5, pricePerNight: 200 },
    { name: '晶華酒店', stars: 5, pricePerNight: 220 },
    { name: '桃園機場飯店', stars: 3, pricePerNight: 60 },
    { name: '車站膠囊旅店', stars: 2, pricePerNight: 25 },
  ],
  'Hong Kong': [
    { name: '尖沙咀彌敦酒店', stars: 3, pricePerNight: 70 },
    { name: '香港半島酒店', stars: 5, pricePerNight: 380 },
    { name: '港島香格里拉', stars: 5, pricePerNight: 340 },
    { name: '富豪九龍酒店', stars: 4, pricePerNight: 110 },
    { name: '機場航天城酒店', stars: 4, pricePerNight: 90 },
  ],
};

function getHotelsForCity(destination: string): typeof MOCK_HOTELS.DEFAULT {
  // Try exact match first
  const cityKey = Object.keys(MOCK_HOTELS).find(
    (k) => k !== 'DEFAULT' && destination.toLowerCase().includes(k.toLowerCase()),
  );
  return MOCK_HOTELS[cityKey ?? 'DEFAULT'];
}

export interface PackageHotel {
  name: string;
  stars: number;
  rating: number; // 0-10 scale (stars * 2)
  pricePerNight: number;
  totalPrice: number; // pricePerNight × nights
  location: string;
  cancellationPolicy: string;
  breakfast: boolean;
  affiliateUrl: string;
}

export interface PackageResult {
  flight: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    price: number; // USD, one-way flight price
    currency: string;
    affiliateUrl: string;
  };
  hotels: PackageHotel[];
  packages: PackageSummary[];
  meta: {
    nights: number;
    currency: string;
    dataSource: 'mock' | 'live';
  };
}

export interface PackageSummary {
  hotel: string;
  hotelStars: number;
  flightPrice: number;
  hotelTotal: number;
  packageTotal: number; // flight + hotel
  separateTotal: number; // same items bought separately (same price)
  savings: number; // package - separate (negative = cheaper together)
  savingsPercent: number;
  /** package is cheaper than booking separately */
  isBetterDeal: boolean;
  verdict: 'package_cheaper' | 'book_separately' | 'same_price';
  recommendation: string;
}

export interface BuildPackageOptions {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers?: number;
  /** filter: only hotels with this many stars or more */
  minStars?: number;
}

function nightsBetween(depart: string, returns?: string): number {
  if (!returns) return 1;
  const msPerDay = 86400000;
  return Math.max(1, Math.round((new Date(returns).getTime() - new Date(depart).getTime()) / msPerDay));
}

function buildAffiliateUrl(base: string): string {
  // Simplified affiliate URL builder — mirrors travelpayouts pattern
  const marker = 'flightplus-20'; // placeholder affiliate marker
  return `${base}&uid=${marker}`;
}

export function buildPackage(options: BuildPackageOptions): PackageResult {
  const { origin, destination, departDate, returnDate } = options;
  const nights = nightsBetween(departDate, returnDate);
  const hotels = getHotelsForCity(destination);

  // Deterministic flight price based on destination hash
  const destHash = destination.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const basePrice = 80 + (destHash % 200); // $80-$280 mock flight price

  const flightPrice = basePrice;
  const currency = 'USD';

  const packageHotels: PackageHotel[] = hotels.map((h) => ({
    name: h.name,
    stars: h.stars,
    rating: h.stars * 2,
    pricePerNight: h.pricePerNight,
    totalPrice: h.pricePerNight * nights,
    location: destination,
    cancellationPolicy: h.stars >= 4 ? '免費取消至入住日前一天' : '預訂後不可退訂',
    breakfast: h.stars >= 4,
    affiliateUrl: buildAffiliateUrl(`https://booking.example.com/hotel/${encodeURIComponent(h.name)}`),
  }));

  const flightAffiliateUrl = buildAffiliateUrl(
    `https://www.aviasales.ru/search?origin_iata=${origin}&destination_iata=${destination}&depart_date=${departDate}`,
  );

  const packages: PackageSummary[] = packageHotels.map((hotel) => {
    const packageTotal = flightPrice + hotel.totalPrice;
    // "Separate" booking: same items, same prices (no bundle discount in mock)
    // Real implementation would show separate retail price
    const separateTotal = packageTotal; // mock: no difference yet
    const savings = packageTotal - separateTotal;
    const savingsPercent = separateTotal > 0 ? Math.round((savings / separateTotal) * 100) : 0;

    let verdict: PackageSummary['verdict'] = 'same_price';
    let recommendation = '分開預訂與套餐價格相同，可自行選擇。';

    if (savings < -5) {
      verdict = 'package_cheaper';
      recommendation = `套裝行程較分開預訂便宜 ${Math.abs(savings).toFixed(0)} USD，節省 ${Math.abs(savingsPercent)}%，建議直接訂套餐。`;
    } else if (savings > 5) {
      verdict = 'book_separately';
      recommendation = `分開預訂比套裝便宜 ${savings.toFixed(0)} USD，建議分開預訂。`;
    }

    return {
      hotel: hotel.name,
      hotelStars: hotel.stars,
      flightPrice,
      hotelTotal: hotel.totalPrice,
      packageTotal,
      separateTotal,
      savings,
      savingsPercent,
      isBetterDeal: savings < 0,
      verdict,
      recommendation,
    };
  });

  // Sort: best deal first (most negative savings = best)
  packages.sort((a, b) => a.savings - b.savings);

  return {
    flight: {
      origin,
      destination,
      departDate,
      returnDate,
      price: flightPrice,
      currency,
      affiliateUrl: flightAffiliateUrl,
    },
    hotels: packageHotels,
    packages,
    meta: {
      nights,
      currency,
      dataSource: 'mock',
    },
  };
}