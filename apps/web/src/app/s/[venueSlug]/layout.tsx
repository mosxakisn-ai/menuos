import type { Metadata, Viewport } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ venueSlug: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { venueSlug } = await params;
  const manifestPath = `/s/${encodeURIComponent(venueSlug)}/manifest.webmanifest`;

  return {
    manifest: manifestPath,
    appleWebApp: {
      capable: true,
      title: "Σερβιτόρος",
      statusBarStyle: "default",
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2563EB",
};

export default function StaffVenueLayout({ children }: Pick<Props, "children">) {
  return children;
}
