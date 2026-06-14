"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AirportSelector from "../components/AirportSelector";

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
    if (!origin || !destination || !departDate) return;
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departDate,
      ...(tripType === "roundtrip" && returnDate ? { returnDate } : {}),
      passengers: passengers.toString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", color: "var(--text-primary)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        background: "rgba(18, 18, 26, 0.9)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>✈️</div>
            <span style={{ fontSize: 22, fontWeight: 700 }}>FlightPlus</span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 28 }}>
            <a
              href="/search"
              style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              機票
            </a>
            <a
              href="/hotels"
              style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              酒店
            </a>
            <a
              href="/deals"
              style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              優惠
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        minHeight: "calc(100vh - 73px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        overflow: "hidden",
      }}>

        {/* Ambient glow effects */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700,
          background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "3%",
          width: 450, height: 450,
          background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: 36, position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            marginBottom: 12,
            background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            找到最優惠的機票
          </h2>
          <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>
            比較全球航空公司，智慧轉機策略，讓您省更多
          </p>
        </div>

        {/* Search Card */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "28px 32px",
          width: "100%",
          maxWidth: 780,
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}>
          {/* Trip Type Toggle */}
          <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
            {(["roundtrip", "oneway"] as const).map((type) => (
              <label
                key={type}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", fontSize: 14,
                  color: tripType === type ? "var(--accent)" : "var(--text-secondary)",
                  transition: "color 0.2s",
                  fontFamily: "inherit",
                }}
              >
                <div
                  onClick={() => setTripType(type)}
                  style={{
                    width: 18, height: 18,
                    border: `2px solid ${tripType === type ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "50%",
                    background: tripType === type ? "var(--accent)" : "transparent",
                    boxShadow: "inset 0 0 0 3px var(--bg-card)",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                />
                {type === "roundtrip" ? "來回" : "單程"}
              </label>
            ))}
          </div>

          <form onSubmit={handleSearch}>
            {/* Search Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 0,
              marginBottom: 16,
              position: "relative",
              alignItems: "end",
            }}>
              {/* Origin */}
              <div style={{ gridColumn: "1" }}>
                <label style={labelStyle}>出發地</label>
                <AirportSelector
                  id="origin"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="選擇機場"
                  required
                />
              </div>

              {/* Swap Button */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 12,
                zIndex: 2,
              }}>
                <button
                  type="button"
                  onClick={handleSwap}
                  style={{
                    width: 36, height: 36,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                    color: "var(--text-secondary)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }}
                  title="交換起點與目的地"
                >
                  ⇄
                </button>
              </div>

              {/* Destination */}
              <div style={{ gridColumn: "3" }}>
                <label style={labelStyle}>目的地</label>
                <AirportSelector
                  id="destination"
                  value={destination}
                  onChange={setDestination}
                  placeholder="選擇機場"
                  required
                />
              </div>
            </div>

            {/* Date Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}>
              <div>
                <label style={labelStyle}>出發日期</label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={today}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  回程日期{" "}
                  {tripType === "oneway" && (
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>（可選）</span>
                  )}
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departDate || today}
                  disabled={tripType === "oneway"}
                  style={{
                    ...inputStyle,
                    opacity: tripType === "oneway" ? 0.4 : 1,
                    cursor: tripType === "oneway" ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>

            {/* Passenger + Submit */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
              alignItems: "end",
            }}>
              <div>
                <label style={labelStyle}>乘客人數</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  style={inputStyle}
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} 人</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!origin || !destination || !departDate}
                style={{
                  padding: "12px 32px",
                  background: origin && destination && departDate ? "var(--accent)" : "var(--bg-secondary)",
                  color: origin && destination && departDate ? "var(--bg-primary)" : "var(--text-muted)",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: origin && destination && departDate ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  boxShadow: origin && destination && departDate ? "0 4px 20px var(--accent-glow)" : "none",
                  fontFamily: "inherit",
                }}
              >
                搜尋航班
              </button>
            </div>
          </form>
        </div>

        {/* Popular Routes */}
        <div style={{ marginTop: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14 }}>
            熱門航線
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
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
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Banner ─────────────────────────────────────── */}
      <section style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "48px 20px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>為何選擇 FlightPlus？</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>
            整合全球 500+ 航空公司的即時價格，比對手找到更多省錢選項
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}>
            {[
              { icon: "🔍", title: "多航空公司比價", desc: "一次搜尋覆蓋傳統航空、低成本航空、包機" },
              { icon: "✈️", title: "智慧中轉最佳化", desc: "自動找出隱藏的低價轉機路線" },
              { icon: "📅", title: "最佳日期掃描器", desc: "分析前後日期範圍，找出最劃算的出發日" },
              { icon: "🚗", title: "鄰近機場比價", desc: "方圓 300 公里機場統統比，不漏掉任何省錢機會" },
            ].map((f) => (
              <div key={f.title} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px",
                textAlign: "left",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2026 FlightPlus. 全球機票比價平台。
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          機票價格來自 Travelpayouts API，實際價格以供應商為準。
        </p>
      </footer>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 15,
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
};