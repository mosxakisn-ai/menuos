import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export const alt = APP_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: 28, fontWeight: 600, opacity: 0.95 }}>{APP_TAGLINE}</p>
        <p style={{ fontSize: 80, fontWeight: 800, marginTop: 16, lineHeight: 1.05 }}>
          Menu<span style={{ opacity: 0.95 }}>Os</span>
        </p>
        <p style={{ fontSize: 28, marginTop: 24, opacity: 0.92, maxWidth: 720 }}>
          Digital menus for restaurants, hotels & hospitality
        </p>
      </div>
    ),
    { ...size },
  );
}
