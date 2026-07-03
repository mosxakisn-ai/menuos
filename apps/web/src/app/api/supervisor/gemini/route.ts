import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { listGeminiRowsForSupervisor } from "@/lib/supervisor-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  try {
    const customers = await listGeminiRowsForSupervisor();
    const totalTokens = customers.reduce((sum, row) => sum + row.geminiTokensThisMonth, 0);
    return NextResponse.json({ customers, totalTokens });
  } catch (err) {
    console.error("[menuos-supervisor] gemini list", err);
    return NextResponse.json({ error: "Failed to load Gemini usage" }, { status: 500 });
  }
}
