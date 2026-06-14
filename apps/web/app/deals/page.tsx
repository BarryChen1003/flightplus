"use client";

import Link from "next/link";

export default function DealsPage() {
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
              { href: "/hotels", label: "酒店" },
              { href: "/deals", label: "優惠", active: true },
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

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>限時優惠</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
            主動監控航空公司降價、折扣碼、限時特賣，第一時間通知你
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}>
          {[
            { icon: "💸", title: "價格警報", desc: "設定目標價格，跌破時自動通知" },
            { icon: "🎫", title: "折扣碼驗證", desc: "即時檢查航空公司促銷碼有效性" },
            { icon: "🔥", title: "閃購偵測", desc: "監控 50+ 航空公司的限時特賣資訊" },
            { icon: "📅", title: "最佳出發日", desc: "AI 分析月曆，標記本週最便宜日期" },
          ].map((f) => (
            <div key={f.title} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px",
          textAlign: "center",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>即將上線</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
            Phase 3 將整合所有優惠監控功能<br />
            搶先體驗？現在就搜尋機票，我們會記住你的偏好
          </p>
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
            開始搜尋 ✈️
          </Link>
        </div>
      </main>
    </div>
  );
}