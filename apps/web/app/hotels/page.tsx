"use client";

import Link from "next/link";

export default function HotelsPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <header style={{
        background: "rgba(18, 18, 26, 0.9)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
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
          <nav style={{ display: "flex", gap: 28 }}>
            {[
              { href: "/search", label: "機票" },
              { href: "/hotels", label: "酒店", active: true },
              { href: "/deals", label: "優惠" },
            ].map((item) => (
              <a key={item.href} href={item.href} style={{
                color: item.active ? "var(--accent)" : "var(--text-secondary)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                borderBottom: item.active ? "2px solid var(--accent)" : "2px solid transparent",
                paddingBottom: 2,
                transition: "color 0.2s",
              }}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🏨</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>酒店搜尋</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 16 }}>
          機+酒套餐功能正在開發中<br />
          完成後將自動分析最佳日期組合，找出最便宜的機加酒方案
        </p>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px",
          textAlign: "left",
          maxWidth: 560,
          margin: "0 auto 32px",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--accent)" }}>
            Phase 2 即將上線 🔜
          </h3>
          <ul style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 20 }}>
            <li>機+酒綁定搜尋（同一頁面選日期 + 目的地）</li>
            <li>根據機票價格自動推薦CP值最高酒店</li>
            <li>日曆視圖：當日機+酒總價一目了然</li>
            <li>隱藏飯店折扣代碼自動套用</li>
          </ul>
        </div>

        <Link href="/search" style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "var(--accent)",
          color: "var(--bg-primary)",
          borderRadius: 10,
          fontWeight: 600,
          textDecoration: "none",
          fontSize: 15,
        }}>
          先搜機票 ✈️
        </Link>
      </main>
    </div>
  );
}