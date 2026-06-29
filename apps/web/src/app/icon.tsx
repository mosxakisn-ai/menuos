import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 280,
            height: 280,
            color: "white",
            fontSize: 160,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
