/**
 * Προσομοίωση PDF import pipeline (όπως το wizard + API).
 * Usage: npx tsx scripts/simulate-pdf-import.ts <path-to.pdf>
 */
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";
import { parseMenuTextFromPdf, resetMenuPdfParserIds } from "@menuos/shared";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract";
import { isOcrSpaceConfigured } from "@/lib/ocr-space";
import { renderPdfPageToJpeg } from "@/lib/pdf-page-render";

const MIN_DIGITAL = 50;
const COVER_MAX = 25;

type PageKind = "digital" | "scan" | "cover";

function classify(textLen: number, page: number, total: number): PageKind {
  if (textLen < COVER_MAX) return "cover";
  if (page === 1 && textLen < MIN_DIGITAL) return "cover";
  if (textLen < MIN_DIGITAL) return "scan";
  return "digital";
}

async function getPageCount(buffer: Buffer): Promise<number> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const info = await parser.getInfo();
    return info.total ?? info.pages?.length ?? 1;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath || !existsSync(pdfPath)) {
    console.error("Usage: npx tsx scripts/simulate-pdf-import.ts <path-to.pdf>");
    process.exit(1);
  }

  const fileName = basename(pdfPath);
  const buffer = readFileSync(pdfPath);
  const sizeKb = Math.round(buffer.length / 1024);

  console.log("\n═══════════════════════════════════════════");
  console.log("  MenuOS — PDF Import Simulation");
  console.log("═══════════════════════════════════════════\n");
  console.log(`📄 Αρχείο: ${fileName}`);
  console.log(`📦 Μέγεθος: ${sizeKb} KB`);
  console.log(`🔑 OCR.space: ${isOcrSpaceConfigured() ? "✅ configured" : "❌ OCR_SPACE_API_KEY λείπει"}\n`);

  // Step 1: Scan
  console.log("▶ Βήμα 1/4 — Σάρωση PDF...");
  const totalPages = await getPageCount(buffer);
  console.log(`   Σελίδες: ${totalPages}\n`);

  const pages: Array<{
    page: number;
    kind: PageKind;
    textLen: number;
    selected: boolean;
    text: string;
    ocrUsed: boolean;
  }> = [];

  // Step 2: Per-page analysis
  console.log("▶ Βήμα 2/4 — Ανάλυση σελίδων...");
  for (let p = 1; p <= totalPages; p += 1) {
    let text = await extractTextFromPdfBuffer(buffer, [p]);
    let ocrUsed = false;

    const kind = classify(text.length, p, totalPages);
    let selected = kind === "digital" || kind === "scan";

    if (text.length < 15 && kind === "scan" && isOcrSpaceConfigured()) {
      process.stdout.write(`   Σελ. ${p}: OCR... `);
      try {
        const jpeg = await renderPdfPageToJpeg(buffer, p);
        const { ocrImageBuffer } = await import("@/lib/ocr-space");
        text = await ocrImageBuffer(jpeg, `${fileName}-p${p}.jpg`);
        ocrUsed = true;
        console.log(`OK (${text.length} chars)`);
      } catch (err) {
        console.log(`FAIL — ${err instanceof Error ? err.message : err}`);
      }
    } else {
      console.log(`   Σελ. ${p}: ${kind.padEnd(7)} | ${text.length} chars${selected ? " ✓" : " (skip)"}`);
    }

    pages.push({ page: p, kind, textLen: text.length, selected, text, ocrUsed });
  }

  const selectedPages = pages.filter((p) => p.selected && p.textLen >= 15);
  console.log(`\n   Επιλεγμένες: ${selectedPages.length}/${totalPages}`);
  console.log(`   OCR κλήσεις: ${pages.filter((p) => p.ocrUsed).length}\n`);

  if (selectedPages.length === 0) {
    console.error("❌ Αποτυχία — καμία σελίδα με κείμενο.");
    if (!isOcrSpaceConfigured()) {
      console.error("   → Βάλε OCR_SPACE_API_KEY στο .env για scan PDF.");
    }
    process.exit(1);
  }

  // Step 3: Merge + parse
  console.log("▶ Βήμα 3/4 — Parsing κατηγοριών & ειδών...");
  const mergedText = selectedPages.map((p) => p.text).join("\n\n");
  resetMenuPdfParserIds();
  const result = parseMenuTextFromPdf(mergedText, fileName);

  console.log(`   Κατηγορίες: ${result.stats.categoriesFound}`);
  console.log(`   Είδη: ${result.stats.itemsFound}`);
  console.log(`   Με τιμή: ${result.stats.itemsWithPrice}`);
  console.log(`   Χωρίς τιμή: ${result.stats.itemsFound - result.stats.itemsWithPrice}`);

  if (result.warnings.length) {
    console.log(`   Προειδοποιήσεις: ${result.warnings.length}`);
    for (const w of result.warnings.slice(0, 5)) {
      console.log(`     ⚠ ${w}`);
    }
  }

  // Step 4: Preview sample
  console.log("\n▶ Βήμα 4/4 — Preview (δείγμα):\n");
  for (const cat of result.categories.slice(0, 4)) {
    console.log(`   📁 ${cat.nameGr}${cat.nameEn ? ` / ${cat.nameEn}` : ""}`);
    for (const item of cat.items.slice(0, 4)) {
      const price = item.price != null ? `€${item.price}` : "—";
      console.log(`      • ${item.nameGr}${item.nameEn ? ` (${item.nameEn})` : ""}  ${price}`);
    }
    if (cat.items.length > 4) console.log(`      … +${cat.items.length - 4} ακόμα`);
  }
  if (result.categories.length > 4) {
    console.log(`   … +${result.categories.length - 4} κατηγορίες ακόμα`);
  }

  console.log("\n═══════════════════════════════════════════");
  if (result.stats.itemsFound > 0) {
    console.log(`✅ Επιτυχία — ${result.stats.itemsFound} είδη έτοιμα για preview/import`);
  } else {
    console.log("⚠️  Parsing OK αλλά 0 είδη — ίσως χρειάζεται AI για layout");
  }
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Simulation failed:", err);
  process.exit(1);
});
