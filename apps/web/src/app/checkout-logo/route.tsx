import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Horizontal logo for Stripe Checkout header (replaces shared-account branding). */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 8px",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 40,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          M
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#0F172A",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -1,
            }}
          >
            Menu<span style={{ color: "#2563EB" }}>OS</span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#64748B",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Scan. Browse. Enjoy.
          </div>
        </div>
      </div>
    ),
    { width: 560, height: 120 },
  );
}
