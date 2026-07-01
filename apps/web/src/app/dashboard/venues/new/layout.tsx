import type { Metadata } from "next";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("newVenue", "/dashboard/venues/new");
}

export default function NewVenueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
