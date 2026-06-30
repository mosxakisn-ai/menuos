"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeroQrCodeProps = {
  url: string;
  size?: number;
  color?: string;
  className?: string;
  alt?: string;
};

/** Real scannable QR for marketing hero — same URL as the live demo iframe. */
export function HeroQrCode({
  url,
  size = 88,
  color = "#1e3a5f",
  className,
  alt = "QR code menu",
}: HeroQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: size * 4,
      margin: 1,
      color: { dark: color, light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then((png) => {
        if (!cancelled) setDataUrl(png);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size, color]);

  if (!dataUrl) {
    return (
      <div
        className={cn("animate-pulse rounded-md bg-slate-100", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-md", className)}
      draggable={false}
    />
  );
}
