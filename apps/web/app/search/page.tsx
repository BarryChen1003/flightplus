"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Flight {
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
  flights: Flight[];
}

// ── Helpers ────────────────────────────────────────────────
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    month: "short", day: "numeric", weekday: "short", timeZone: "UTC",
  });
}

function formatPrice(price: number, currency: string): string {
  if (currency === "USD") return `$${price.toLocaleString()}`;
  return `NT$${price.toLocaleString()}`;
}

// ── API Base URL ───────────────────────────────────────────
const API = "https://flightplus-api.onrender.com";

// ── Search Content ─────────────────────────────────────────
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [nearest, setNearest] = useState<NearestAirport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"flights" | "calendar">("flights");
  const [sortBy, setSortBy] = useState<"price" | "duration">("price");

  const origin = (searchParams.get("origin") || "TPE").toUpperCase();
  const destination = (searchParams.get("destination") || "NRT").toUpperCase();
  const departDate = searchParams.get("departDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const passengers = searchParams.get("passengers") || "1";

  useEffect(() => {
    if (!departDate) return;
    setLoading(true);

    Promise.all([
      fetch(`${API}/api/flights/search?origin=${origin}&destination=${destination}&departDate=${departDate}`)
        .then((r) => r.json())
        .then((d) => d.flights || [])
        .catch(() => []),
      fetch(`${API}/api/flights/nearest-airports?origin=${origin}&destination=${destination}&date=${departDate}`)
        .then((r) => r.json())
        .then((d) => d.airports || [])
        .catch(() => []),
    ]).then(([f, n]) => {
      setFlights(f);
      setNearest(n);
      setLoading(false);
    });
  }, [origin, destination, departDate]);

  const sorted = [...flights].sort((a, b) =>
    sortBy === "price" ? a.price - b.price : a.duration - b.duration
  );

  return (
    <>
      {/* Search Summary Bar */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 20px",
        marginBottom: 24,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 16,
        fontSize: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
            {origin}
          </span>
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
            {destination}
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <div style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{departDate}</span>
          {returnDate && <><span style={{ margin: "0 8px", color: "var(--text-muted)" }}>↔</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{returnDate}</span></>}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <div style={{ color: "var(--text-secondary)" }}>{passengers} 人</div>
        <div style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 13 }}>
          {loading ? "搜尋中..." : `找到 ${flights.length} 個航班`}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* ── Main: Flight List ───────────────────────────────── */}
        <div>
          {/* Tabs + Sort */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px 12px 0 0",
            display: "flex",
            borderBottom: "none",
          }}>
            {(["flights", "calendar"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "12px",
                  background: "transparent",
                  border: "none",
                  color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
                  borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                {tab === "flights" ? "航班列表" : "價格日曆"}
              </button>
            ))}
            <div style={{ padding: "12px 16px", marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "price" | "duration")}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="price">價格</option>
                <option value="duration">飛行時間</option>
              </select>
            </div>
          </div>

          {/* Flight Cards */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✈️</div>
                <div style={{ fontSize: 14 }}>搜尋中...</div>
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>😢</div>
                <div style={{ fontSize: 14 }}>目前沒有找到航班，請嘗試其他日期</div>
              </div>
            ) : activeTab === "flights" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {sorted.map((flight, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "18px 20px",
                      borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
                      display: "grid",
                      gridTemplateColumns: "100px 1fr auto",
                      gap: 20,
                      alignItems: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Airline */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: 44, height: 44,
                        background: "var(--bg-secondary)",
                        borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, margin: "0 auto 6px",
                      }}>🛫</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
                        {flight.airline}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", textAlign: "center" }}>
                        {flight.flightNumber}
                      </div>
                    </div>

                    {/* Route */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>{formatTime(flight.departure)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                          {flight.origin}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {formatDate(flight.departure)}
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {formatDuration(flight.duration)}
                        </div>
                        <div style={{
                          width: 80, height: 1,
                          background: "var(--border)",
                          margin: "4px auto",
                          position: "relative",
                        }}>
                          {flight.stops > 0 && (
                            <div style={{
                              position: "absolute", top: -2, left: "50%",
                              transform: "translateX(-50%)",
                              width: 6, height: 6,
                              background: "var(--warning)",
                              borderRadius: "50%",
                            }} />
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: flight.stops === 0 ? "var(--success)" : "var(--text-muted)" }}>
                          {flight.stops === 0 ? "直飛" : `${flight.stops} 轉機`}
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>{formatTime(flight.arrival)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                          {flight.destination}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {formatDate(flight.arrival)}
                        </div>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
                          {formatPrice(flight.price, flight.currency)}
                        </span>
                      </div>
                      <a
                        href={flight.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 20px",
                          background: "var(--accent)",
                          color: "var(--bg-primary)",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          boxShadow: "0 2px 12px var(--accent-glow)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,212,255,0.5)")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px var(--accent-glow)")}
                      >
                        前往預訂
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Calendar placeholder */
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                📅 價格日曆（即將上線，Phase 2 支援）
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Nearest Airport Tips */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🚗</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                鄰近機場優惠
              </span>
            </div>
            {loading ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>載入中...</div>
            ) : nearest.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>目前無替代機場優惠</div>
            ) : (
              nearest.map((a) => (
                <div key={a.iata} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px",
                  background: "var(--bg-secondary)",
                  borderRadius: 8,
                  marginBottom: 6,
                }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                      {a.iata}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                      {a.name}（{a.distance}km）
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                    省 NT${a.savings.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Hub Tips */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🛫</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                替代樞紐提示
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              經主要樞紐轉機可能更便宜
            </div>
            {[
              { hub: "ICN", name: "首爾仁川", savings: 2100 },
              { hub: "HKG", name: "香港國際", savings: 1500 },
            ].map((h) => (
              <div key={h.hub} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                marginBottom: 6,
              }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--accent-secondary)" }}>
                    {h.hub}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{h.name}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                  省 NT${h.savings.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Hotel Stub */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🏨</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                機+酒套裝
              </span>
            </div>
            <div style={{
              padding: 20,
              background: "var(--bg-secondary)",
              borderRadius: 8,
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-muted)",
            }}>
              即將上線
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "18px 16px",
};

// ── Page ───────────────────────────────────────────────────
export default function SearchPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", color: "var(--text-primary)" }}>

      {/* Header */}
      <header style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)",
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>✈️</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>FlightPlus</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>搜尋結果</span>
            <Link
              href="/"
              style={{
                padding: "7px 16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              重新搜尋
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        <Suspense fallback={<div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>載入中...</div>}>
          <SearchResultsContent />
        </Suspense>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>© 2026 FlightPlus. 全球機票比價平台。</p>
      </footer>
    </div>
  );
}