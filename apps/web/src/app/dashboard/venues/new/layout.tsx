import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Νέο κατάστημα", "/dashboard/venues/new");

export default function NewVenueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
