import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";
import RegisterPageClient from "./register-client";

export const metadata: Metadata = buildPrivatePageMetadata("Εγγραφή", "/register");

export default function RegisterPage() {
  return <RegisterPageClient />;
}
