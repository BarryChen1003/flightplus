"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface Flight {
  id: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: number;
  stops: number;
  origin: string;
  destination: string;
  affiliateUrl: string;
}

interface NearestAirport {
  iata: string;
  name: string;
  distance: number;
  savings: number;
}

const MOCK_FLIGHTS: Flight[] = [
  {
    id: "1",
    price: 4280,
    currency: "TWD",
    airline: "星宇航空",
    flightNumber: "JX800",
    departure: "2026-08-01T08:00:00Z",
    arrival: "2026-08-01T12:30:00Z",
    duration: 270,
    stops: 0,
    origin: "TPE",
    destination: "NRT",
    affiliateUrl: "#",
  },
  {
    id: "2",
    price: 3650,
    currency: "TWD",
    airline: "香草航空",
    flightNumber: "JW876",
    departure: "2026-08-01T14:15:00Z",
    arrival: "2026-08-01T18:40:00Z",
    duration: 265,
    stops: 0,
    origin: "TPE",
    destination: "NRT",
    affiliateUrl: "#",
  },
  {
    id: "3",
    price: 2999,
    currency: "TWD",
    airline: "長榮航空",
    flightNumber: "BR184",
    departure: "2026-08-01T09:30:00Z",
    arrival: "2026-08-01T18:00:00Z",
    duration: 510,
    stops: 1,
    origin: "TPE",
    destination: "NRT",
    affiliateUrl: "#",
  },
  {
    id: "4",
    price: 5100,
    currency: "TWD",
    airline: "中華航空",
    flightNumber: "CI100",
    departure: "2026-08-01T11:00:00Z",
    arrival: "2026-08-01T15:20:00Z",
    duration: 260,
    stops: 0,
    origin: "TPE",
    destination: "NRT",
    affiliateUrl: "#",
  },
];

const MOCK_NEAREST: NearestAirport[] = [
  { iata: "KIX", name: "關西國際機場", distance: 170, savings: 1200 },
  { iata: "NGO", name: "中部國際機場", distance: 280, savings: 800 },
];

const MOCK_HUBS: { hub: string; name: string; savings: number }[] = [
  { hub: "ICN", name: "首爾仁川機場", savings: 2100 },
  { hub: "HKG", name: "香港國際機場", savings: 1500 },
];

const MOCK_CALENDAR: { date: string; price: number }[] = Array.from(
  { length: 7 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      price: Math.floor(3000 + Math.random() * 2500),
    };
  }
);

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"flights" | "calendar">("flights");

  const origin = searchParams.get("origin") || "TPE";
  const destination = searchParams.get("destination") || "NRT";
  const departDate = searchParams.get("departDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const passengers = searchParams.get("passengers") || "1";

  return (
    <>
      {/* Search Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">{origin}</span>
            <span className="text-gray-400">→</span>
            <span className="font-mono font-bold text-lg">{destination}</span>
          </div>
          <div className="w-px h-6 bg-gray-300 hidden sm:block" />
          <div className="text-gray-600">
            <span className="font-medium text-gray-900">{departDate}</span>
            {returnDate && (
              <>
                <span className="mx-2">↔</span>
                <span className="font-medium text-gray-900">{returnDate}</span>
              </>
            )}
          </div>
          <div className="w-px h-6 bg-gray-300 hidden sm:block" />
          <div className="text-gray-600">{passengers} 人</div>
          <div className="ml-auto text-sky-600 font-medium">
            找到 {MOCK_FLIGHTS.length} 個航班
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setActiveTab("flights")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "flights"
                    ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                航班列表
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("calendar")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "calendar"
                    ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                價格日曆
              </button>
            </div>

            <div className="p-4">
              {activeTab === "flights" ? (
                <div className="space-y-3">
                  {MOCK_FLIGHTS.map((flight) => (
                    <div
                      key={flight.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Airline */}
                        <div className="flex flex-col items-center min-w-[80px]">
                          <span className="text-sm text-gray-500">
                            {flight.airline}
                          </span>
                          <span className="font-mono font-medium">
                            {flight.flightNumber}
                          </span>
                        </div>

                        {/* Route */}
                        <div className="flex-1 flex items-center gap-2">
                          <div className="text-center">
                            <div className="text-xl font-bold">
                              {formatTime(flight.departure)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {flight.origin}
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-2">
                            <div className="text-xs text-gray-400">
                              {formatDuration(flight.duration)}
                            </div>
                            <div className="w-full h-px bg-gray-300 relative my-1">
                              {flight.stops > 0 && (
                                <>
                                  {Array.from({ length: flight.stops }).map(
                                    (_, i) => (
                                      <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-sky-400 rounded-full"
                                      />
                                    )
                                  )}
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {flight.stops === 0
                                ? "直飛"
                                : `${flight.stops} 轉機`}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">
                              {formatTime(flight.arrival)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {flight.destination}
                            </div>
                          </div>
                        </div>

                        {/* Price & Buy */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="text-2xl font-bold text-sky-600">
                              NT${flight.price.toLocaleString()}
                            </span>
                          </div>
                          <a
                            href={flight.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition text-sm"
                          >
                            購買
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Calendar View */
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    7月份價格趨勢
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {MOCK_CALENDAR.map((day) => (
                      <div
                        key={day.date}
                        className="text-center p-2 border border-gray-200 rounded-lg hover:border-sky-300 transition cursor-pointer"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {formatDate(day.date)}
                        </div>
                        <div className="font-semibold text-sky-600">
                          NT${day.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    * 價格為來回機票每人價格，可能因匯率變動而調整
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Nearest Airport Tips */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🚗 鄰近機場優惠
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              考慮從鄰近機場出發，節省更多
            </p>
            <div className="space-y-2">
              {MOCK_NEAREST.map((airport) => (
                <div
                  key={airport.iata}
                  className="flex items-center justify-between p-2 bg-sky-50 rounded-lg"
                >
                  <div>
                    <span className="font-mono font-bold text-sky-700">
                      {airport.iata}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {airport.name} ({airport.distance}km)
                    </span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    省 NT${airport.savings.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hub Tips */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🛫 替代樞紐提示
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              經過主要樞紐機場轉機可能更便宜
            </p>
            <div className="space-y-2">
              {MOCK_HUBS.map((hub) => (
                <div
                  key={hub.hub}
                  className="flex items-center justify-between p-2 bg-amber-50 rounded-lg"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-700">
                      {hub.hub}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {hub.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    省 NT${hub.savings.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel Stub */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🏨 機+酒套裝
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              預訂機票同時解鎖飯店優惠
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">
                飯店推薦區塊（即將上線）
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            ✈️ FlightPlus
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-600">搜尋結果</span>
            <Link
              href="/"
              className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg text-sm hover:bg-sky-200 transition"
            >
              重新搜尋
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">載入中...</div>
            </div>
          }
        >
          <SearchResultsContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>© 2026 FlightPlus. 全球機票比價平台。</p>
        </div>
      </footer>
    </div>
  );
}