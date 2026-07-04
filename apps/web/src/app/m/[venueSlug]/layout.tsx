import { playfair } from "@/lib/fonts";

export default function PublicMenuLayout({ children }: { children: React.ReactNode }) {
  return <div className={playfair.variable}>{children}</div>;
}
