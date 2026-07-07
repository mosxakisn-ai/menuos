import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Square product + icon image for Stripe Checkout (512×512). */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 320,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 88,
              height: 88,
              borderRadius: 16,
              background: "rgba(255,255,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#2563EB" }} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 88,
              height: 88,
              borderRadius: 16,
              background: "rgba(255,255,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#06B6D4" }} />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 88,
              height: 88,
              borderRadius: 16,
              background: "rgba(255,255,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#06B6D4" }} />
          </div>
          <div
            style={{
              color: "white",
              fontSize: 148,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -4,
            }}
          >
            M
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
