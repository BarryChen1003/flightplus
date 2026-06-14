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
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)",
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
            }}>
              ✈️
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              FlightPlus
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 28 }}>
            {["機票", "酒店", "優惠"].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {item}
              </a>
            ))}
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
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "5%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
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
          maxWidth: 760,
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}>
          {/* Trip Type */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            {(["roundtrip", "oneway"] as const).map((type) => (
              <label key={type} style={{
                display: "flex", alignItems: "center", gap: 8,
                cursor: "pointer", fontSize: 14,
                color: tripType === type ? "var(--accent)" : "var(--text-secondary)",
                transition: "color 0.2s",
              }}>
                <input
                  type="radio"
                  name="tripType"
                  checked={tripType === type}
                  onChange={() => setTripType(type)}
                  style={{ appearance: "none", width: 18, height: 18 }}
                />
                <span style={{
                  width: 18, height: 18,
                  border: `2px solid ${tripType === type ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "50%",
                  display: "inline-block",
                  background: tripType === type ? "var(--accent)" : "transparent",
                  boxShadow: "inset 0 0 0 3px var(--bg-card)",
                  transition: "all 0.2s",
                }} />
                {type === "roundtrip" ? "來回" : "單程"}
              </label>
            ))}
          </div>

          <form onSubmit={handleSearch}>
            {/* Search Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}>
              {/* Origin + Destination with Swap */}
              <div style={{ display: "contents" }}>
                <div style={{ position: "relative" }}>
                  <label style={labelStyle}>出發地</label>
                  <input
                    id="origin"
                    type="text"
                    placeholder="TPE"
                    maxLength={3}
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Swap Button */}
                <div style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
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
                    title="交換起點與目的地"
                  >
                    ⇄
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>目的地</label>
                  <input
                    id="destination"
                    type="text"
                    placeholder="NRT"
                    maxLength={3}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    required
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                  />
                </div>
              </div>

              {/* Dates */}
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
                <label style={labelStyle}>回程日期 {tripType === "oneway" && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>（可選）</span>}</label>
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

              {/* Passengers */}
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 20px var(--accent-glow)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(0,212,255,0.5)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px var(--accent-glow)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              搜尋航班
            </button>
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

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "32px 0",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          © 2026 FlightPlus. 全球機票比價平台。
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          機票價格來自 Travelpayouts API，實際價格以供應商為準。
        </p>
      </footer>
    </div>
  );
}

// ── Inline styles ──────────────────────────────────────────
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