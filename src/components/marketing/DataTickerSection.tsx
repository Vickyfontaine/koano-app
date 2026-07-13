"use client";

import React from "react";

const DATA_SOURCES = [
  "Census", "Shovels.ai", "Placer.ai", "First Street", "FBI UCR",
  "ATTOM", "AirDNA", "Zoneomics", "Redfin", "FHFA", "FEMA",
  "Walk Score", "CoStar", "Regrid", "HouseCanary", "CoreLogic",
  "SafeGraph", "Google Trends", "OpenStreetMap", "NOAA",
  "IRS Opportunity Zones", "HUD USER", "SEC EDGAR", "Yelp Fusion",
  "BatchData", "GreatSchools", "MSCI RCA",
];

export default function DataTickerSection() {
  // Duplicate sources for seamless infinite scroll
  const tickerContent = [...DATA_SOURCES, ...DATA_SOURCES];

  return (
    <section
      id="data-ticker-section"
      style={{
        background: "var(--pale-wash)",
        padding: "48px 0",
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "var(--ink-muted)",
          fontWeight: 400,
          marginBottom: "28px",
        }}
      >
        Dozens of data sources powering every verdict
      </p>

      {/* Ticker track */}
      <div style={{ overflow: "hidden", width: "100%" }}>
        <div className="ticker-track">
          {tickerContent.map((source, i) => (
            <span
              key={`${source}-${i}`}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: "var(--ink-faint)",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                padding: "0 16px",
              }}
            >
              {source}
              <span
                style={{
                  margin: "0 0 0 32px",
                  opacity: 0.4,
                  userSelect: "none",
                }}
              >
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
