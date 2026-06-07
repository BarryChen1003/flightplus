"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">("roundtrip");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departDate,
      ...(tripType === "roundtrip" && returnDate ? { returnDate } : {}),
      passengers: passengers.toString(),
    });

    console.log("🔍 Search payload:", Object.fromEntries(params));

    router.push(`/search?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sky-600">
            ✈️ FlightPlus
          </h1>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-sky-600 transition">
              機票
            </a>
            <a href="#" className="text-gray-600 hover:text-sky-600 transition">
              酒店
            </a>
            <a href="#" className="text-gray-600 hover:text-sky-600 transition">
              優惠
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            找到最優惠的機票
          </h2>
          <p className="text-lg text-gray-600">
            比較全球航空公司，智慧轉機策略，讓您省更多
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
          {/* Trip Type Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setTripType("roundtrip")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                tripType === "roundtrip"
                  ? "bg-sky-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              來回
            </button>
            <button
              type="button"
              onClick={() => setTripType("oneway")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                tripType === "oneway"
                  ? "bg-sky-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              單程
            </button>
          </div>

          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Origin */}
              <div>
                <label
                  htmlFor="origin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  出發地
                </label>
                <input
                  id="origin"
                  type="text"
                  placeholder="TPE"
                  maxLength={3}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none uppercase font-mono text-lg transition"
                />
              </div>

              {/* Destination */}
              <div>
                <label
                  htmlFor="destination"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  目的地
                </label>
                <input
                  id="destination"
                  type="text"
                  placeholder="NRT"
                  maxLength={3}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none uppercase font-mono text-lg transition"
                />
              </div>

              {/* Departure Date */}
              <div>
                <label
                  htmlFor="departDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  出發日期
                </label>
                <input
                  id="departDate"
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={today}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                />
              </div>

              {/* Return Date */}
              {tripType === "roundtrip" && (
                <div>
                  <label
                    htmlFor="returnDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    回程日期
                  </label>
                  <input
                    id="returnDate"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departDate || today}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Passengers & Search Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label
                  htmlFor="passengers"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  乘客人數
                </label>
                <select
                  id="passengers"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white"
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} 人
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
              >
                搜尋航班
              </button>
            </div>
          </form>
        </div>

        {/* Popular Routes */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            熱門航線
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { from: "TPE", to: "NRT" },
              { from: "TPE", to: "ICN" },
              { from: "TPE", to: "KIX" },
              { from: "TPE", to: "SIN" },
              { from: "TPE", to: "LAX" },
            ].map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                type="button"
                onClick={() => {
                  setOrigin(route.from);
                  setDestination(route.to);
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-sky-400 hover:text-sky-600 transition"
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>© 2026 FlightPlus. 全球機票比價平台。</p>
          <p className="mt-2">
            機票價格來自 Travelpayouts API，實際價格以供應商為準。
          </p>
        </div>
      </footer>
    </div>
  );
}