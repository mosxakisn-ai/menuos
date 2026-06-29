import type { Metadata } from "next";
import { buildPrivatePageMetadata } from "@/lib/seo";
import LoginPageClient from "./login-client";

export const metadata: Metadata = buildPrivatePageMetadata("Login", "/login");

export default function LoginPage() {
  return <LoginPageClient />;
}
