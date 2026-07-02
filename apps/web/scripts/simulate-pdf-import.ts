/**
 * Προσομοίωση PDF import pipeline (ίδια λογική με το wizard + API).
 *
 * Usage:
 *   npm run test:pdf-import
 *   npm run test:pdf-import -- path/to/other.pdf
 */
import { readFileSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMenuTextFromPdf, resetMenuPdfParserIds } from "@menuos/shared";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract";
import { isOcrSpaceConfigured } from "@/lib/ocr-space";
import { renderPdfPageToJpeg } from "@/lib/pdf-page-render";
import {
  classifyPdfImportPage,
  ensureAnalyzablePageSelection,
  selectMenuImportPages,
  type PdfPageKind,
} from "@/lib/pdf-import-page-classify";

const DEFAULT_FIXTURE = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../test-fixtures/pdf/stegnakozas-menu-25.pdf",
);

const MIN_TEXT_CHARS = 15;

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
  const pdfPath = resolve(process.argv[2] ?? DEFAULT_FIXTURE);
  if (!existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    console.error("Usage: npm run test:pdf-import -- [path-to.pdf]");
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

  console.log("▶ Βήμα 1/4 — Σάρωση PDF...");
  const totalPages = await getPageCount(buffer);
  console.log(`   Σελίδες: ${totalPages}\n`);

  const classified: Array<{
    page: number;
    kind: PdfPageKind;
    textLen: number;
    selected: boolean;
    text: string;
    ocrUsed: boolean;
  }> = [];

  console.log("▶ Βήμα 2/4 — Ανάλυση σελίδων...");
  for (let p = 1; p <= totalPages; p += 1) {
    const embedded = await extractTextFromPdfBuffer(buffer, [p]);
    const { kind, selected: autoSelected } = classifyPdfImportPage(embedded.length, p, totalPages);
    let selected = autoSelected;
    let text = embedded;
    let ocrUsed = false;

    if (selected && text.length < MIN_TEXT_CHARS && isOcrSpaceConfigured()) {
      process.stdout.write(`   Σελ. ${p}: ${kind} → OCR... `);
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
      console.log(
        `   Σελ. ${p}: ${kind.padEnd(7)} | ${embedded.length} chars embedded${selected ? " ✓" : " (skip)"}`,
      );
    }

    classified.push({
      page: p,
      kind,
      textLen: text.length,
      selected,
      text,
      ocrUsed,
    });
  }

  let pages = selectMenuImportPages(classified);
  pages = ensureAnalyzablePageSelection(pages);

  const selectedPages = pages.filter((p) => p.selected);
  const withText = selectedPages.filter((p) => p.textLen >= MIN_TEXT_CHARS);

  console.log(`\n   Επιλεγμένες: ${selectedPages.length}/${totalPages}`);
  console.log(`   Με κείμενο (μετά OCR): ${withText.length}`);
  console.log(`   OCR κλήσεις: ${pages.filter((p) => p.ocrUsed).length}\n`);

  if (selectedPages.length === 0) {
    console.error("❌ Αποτυχία — καμία σελίδα επιλέχθηκε.");
    process.exit(1);
  }

  if (withText.length === 0) {
    console.error("❌ Αποτυχία — καμία σελίδα με κείμενο.");
    if (!isOcrSpaceConfigured()) {
      console.error("   → Βάλε OCR_SPACE_API_KEY στο .env για σαρωμένα PDF.");
    }
    process.exit(1);
  }

  console.log("▶ Βήμα 3/4 — Parsing κατηγοριών & ειδών...");
  const mergedText = withText.map((p) => p.text).join("\n\n");
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
    console.log("⚠️  Parsing OK αλλά 0 είδη — ίσως χρειάζεται χειροκίνητη διόρθωση");
  }
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Simulation failed:", err);
  process.exit(1);
});
