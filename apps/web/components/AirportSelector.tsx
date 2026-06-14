"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { airports } from "../src/lib/airports";

const REGION_LABELS: Record<string, string> = {
  "east-asia": "東北亞",
  "southeast-asia": "東南亞",
  "north-america": "北美",
  "europe": "歐洲",
  "oceania": "大洋洲",
  "south-asia": "南亞",
  "middle-east": "中東",
  "africa": "非洲",
  "south-america": "南美",
};

const REGION_ORDER = ["east-asia", "southeast-asia", "north-america", "europe", "oceania", "south-asia"];

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "var(--accent-glow)", color: "var(--accent)", borderRadius: 2, padding: "0 2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface AirportSelectorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function AirportSelector({
  value,
  onChange,
  placeholder = "TPE",
  id,
  required,
  disabled,
}: AirportSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allAirports = airports;

  // Build grouped + filtered list
  const getFiltered = useCallback(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? allAirports.filter(
          (a) =>
            a.iata.toLowerCase().includes(q) ||
            a.city_zh.includes(query) ||
            a.city_en.toLowerCase().includes(q) ||
            a.name_zh.includes(query) ||
            a.name_en.toLowerCase().includes(q)
        )
      : allAirports;
    const grouped: Record<string, typeof allAirports> = {};
    for (const a of filtered) {
      if (!grouped[a.region]) grouped[a.region] = [];
      grouped[a.region].push(a);
    }
    return grouped;
  }, [query, allAirports]);

  // Flat index for keyboard nav
  const flatAirports = REGION_ORDER.flatMap((r) => getFiltered()[r] || []);

  // Selected airport info
  const selected = allAirports.find((a) => a.iata === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${highlighted}"]`) as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setQuery("");
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, flatAirports.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (flatAirports[highlighted]) {
          onChange(flatAirports[highlighted].iata);
          setOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (airport: (typeof allAirports)[0]) => {
    onChange(airport.iata);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const grouped = getFiltered();

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Hidden real input for form submission */}
      <input
        type="hidden"
        id={id}
        name={id}
        value={value}
        required={required}
      />

      {/* Clickable display */}
      <div
        onClick={() => !disabled && (setOpen(true), inputRef.current?.focus())}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: disabled ? "var(--bg-secondary)" : "var(--bg-secondary)",
          border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 10,
          fontSize: 15,
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "border-color 0.2s",
          fontFamily: "inherit",
        }}
      >
        {selected ? (
          <>
            <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
              {selected.iata}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {selected.city_zh} · {selected.city_en}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 13 }}>{placeholder}</span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            zIndex: 9999,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            maxHeight: 360,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="搜尋城市或機場代碼..."
              style={{
                width: "100%",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Results */}
          <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
            {flatAirports.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                找不到符合的機場
              </div>
            ) : (
              REGION_ORDER.filter((r) => grouped[r]?.length).map((region) => (
                <div key={region}>
                  <div style={{
                    padding: "6px 14px 4px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "var(--bg-secondary)",
                    position: "sticky",
                    top: 0,
                  }}>
                    {REGION_LABELS[region] || region}
                  </div>
                  {grouped[region].map((airport) => {
                    const globalIdx = flatAirports.indexOf(airport);
                    const isHl = globalIdx === highlighted;
                    return (
                      <div
                        key={airport.iata}
                        data-idx={globalIdx}
                        onClick={() => handleSelect(airport)}
                        style={{
                          padding: "9px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          background: isHl ? "var(--bg-card-hover)" : "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card-hover)";
                          setHighlighted(globalIdx);
                        }}
                        onMouseLeave={(e) => {
                          if (globalIdx !== highlighted) {
                            (e.currentTarget as HTMLDivElement).style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--accent)",
                          minWidth: 36,
                        }}>
                          {airport.iata}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                          {highlight(airport.city_zh, query)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {highlight(airport.city_en, query)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                          {airport.name_zh}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
            display: "flex",
            gap: 12,
          }}>
            <span>↑↓ 選擇</span>
            <span>↵ 確認</span>
            <span>Esc 關閉</span>
          </div>
        </div>
      )}
    </div>
  );
}