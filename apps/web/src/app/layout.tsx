import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { RootJsonLd } from "@/components/seo/json-ld";
import { buildRootMetadata } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "greek"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={manrope.variable}>
      <body className="min-h-screen font-sans">
        <RootJsonLd />
        {children}
      </body>
    </html>
  );
}
