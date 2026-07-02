/**
 * Admin: import PDF catalog into a customer menu (production support).
 *
 * Usage (from repo root, with .env / DATABASE_URL + OCR_SPACE_API_KEY):
 *   npx tsx --env-file=.env apps/web/scripts/admin-import-customer-menu.ts fanenos@gmail.com apps/web/test-fixtures/pdf/stegnakozas-menu-25.pdf
 *
 * Options:
 *   --menu-id=<id>     Target menu (default: newest menu in first venue)
 *   --replace          Delete existing categories/items on that menu first
 *   --dry-run          Parse only, no DB writes
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { prisma } from "@menuos/db";
import { buildMenuNameTranslations } from "@menuos/shared";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract";
import { finalizePdfImportPipeline } from "@/lib/pdf-import-pipeline";
import { enhancePdfImportWithVision } from "@/lib/pdf-import-vision";
import { isOcrSpaceConfigured, ocrImageBuffer } from "@/lib/ocr-space";
import { renderPdfPageToJpeg } from "@/lib/pdf-page-render";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";
import {
  classifyPdfImportPage,
  ensureAnalyzablePageSelection,
  selectMenuImportPages,
} from "@/lib/pdf-import-page-classify";

const MIN_TEXT_CHARS = 15;

function parseArgs(argv: string[]) {
  const flags = { menuId: "", replace: false, dryRun: false };
  const positional: string[] = [];
  for (const arg of argv) {
    if (arg === "--replace") flags.replace = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg.startsWith("--menu-id=")) flags.menuId = arg.slice("--menu-id=".length);
    else positional.push(arg);
  }
  return { ...flags, email: positional[0] ?? "", pdfPath: positional[1] ? resolve(positional[1]) : "" };
}

async function getPageCount(buffer: Buffer): Promise<number> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const info = await parser.getInfo();
    return info.total ?? 1;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractPdfForImport(buffer: Buffer, fileName: string) {
  const totalPages = await getPageCount(buffer);
  const classified: Array<{
    page: number;
    kind: ReturnType<typeof classifyPdfImportPage>["kind"];
    selected: boolean;
    text: string;
    usedOcr: boolean;
  }> = [];

  for (let p = 1; p <= totalPages; p += 1) {
    const embedded = await extractTextFromPdfBuffer(buffer, [p]);
    const { kind, selected } = classifyPdfImportPage(embedded.length, p, totalPages);
    let text = embedded;
    let usedOcr = false;
    if (selected && text.length < MIN_TEXT_CHARS) {
      if (!isOcrSpaceConfigured()) {
        throw new Error("OCR_SPACE_API_KEY required for scanned PDF");
      }
      const jpeg = await renderPdfPageToJpeg(buffer, p);
      text = await ocrImageBuffer(jpeg, `${fileName}-p${p}.jpg`);
      usedOcr = true;
    }
    classified.push({ page: p, kind, selected, text, usedOcr });
  }

  const pages = ensureAnalyzablePageSelection(selectMenuImportPages(classified));
  const withText = pages.filter((p) => p.selected && p.text.trim().length >= MIN_TEXT_CHARS);
  if (withText.length === 0) {
    throw new Error("No text extracted from selected pages");
  }

  const ocrPageNumbers = withText.filter((p) => p.usedOcr).map((p) => p.page);
  const ocrPages = ocrPageNumbers.length;
  const digitalPages = withText.filter((p) => !p.usedOcr).length;
  const merged = withText.map((p) => p.text.trim()).join("\n\n");

  const rules = finalizePdfImportPipeline([{ name: fileName, text: merged }], {
    digitalPages,
    ocrPages,
  });

  const fileContexts =
    ocrPageNumbers.length > 0 ? [{ name: fileName, buffer, ocrPageNumbers }] : [];

  return enhancePdfImportWithVision(rules, fileContexts);
}

async function main() {
  const { email, pdfPath, menuId: menuIdFlag, replace, dryRun } = parseArgs(process.argv.slice(2));

  if (!email || !pdfPath) {
    console.error(
      "Usage: npx tsx apps/web/scripts/admin-import-customer-menu.ts <email> <pdf> [--menu-id=] [--replace] [--dry-run]",
    );
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      email: true,
      name: true,
      organizationId: true,
      organization: {
        select: {
          slug: true,
          venues: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              menus: {
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  _count: { select: { categories: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.organization) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  let menuId = menuIdFlag;
  if (!menuId) {
    const allMenus = user.organization.venues.flatMap((v) =>
      v.menus.map((m) => ({ ...m, venueName: v.name })),
    );
    const kozasMenu = allMenus.find((m) => /kozas|κοζα/i.test(m.name));
    const emptyMenu = allMenus.find((m) => m._count.categories === 0);
    const menu = kozasMenu ?? emptyMenu ?? allMenus[0];
    if (!menu) {
      console.error("No menu found for organization");
      process.exit(1);
    }
    menuId = menu.id;
    console.log(`Target venue: ${menu.venueName}`);
    console.log(`Target menu: ${menu.name} (${menu.id}) — ${menu._count.categories} categories`);
  } else {
    const found = user.organization.venues.flatMap((v) => v.menus).find((m) => m.id === menuId);
    console.log(`Target menu: ${found?.name ?? menuId}`);
  }

  const buffer = readFileSync(pdfPath);
  const fileName = basename(pdfPath);
  console.log(`\nParsing ${fileName} (${Math.round(buffer.length / 1024)} KB)...`);
  console.log(`OCR: ${isOcrSpaceConfigured() ? "yes" : "NO"}`);
  console.log(`Vision: ${isPdfVisionConfigured() ? "yes" : "NO"}`);

  const draft = await extractPdfForImport(buffer, fileName);
  console.log(
    `Pipeline: ${draft.extraction.path}${draft.extraction.visionUsed ? " (Vision AI)" : ""}`,
  );
  const selectedCategories = draft.categories.filter((c) => c.selected !== false);
  const selectedItems = selectedCategories.flatMap((c) => c.items.filter((i) => i.selected !== false));

  console.log(`\nParsed: ${selectedCategories.length} categories, ${selectedItems.length} items`);
  const greekItems = selectedItems.filter((i) => /[\u0370-\u03FF]/.test(i.nameGr)).length;
  console.log(`Greek names (nameGr): ${greekItems}/${selectedItems.length}`);
  console.log(`With price: ${draft.stats.itemsWithPrice}`);

  if (dryRun) {
    console.log("\nDRY_RUN — no database changes.");
    return;
  }

  if (selectedItems.length === 0) {
    console.error("Nothing to import");
    process.exit(1);
  }

  if (replace) {
    const deleted = await prisma.category.deleteMany({ where: { menuId } });
    console.log(`\nCleared menu (deleted ${deleted.count} categories + items).`);
  }

  const maxSortCat = await prisma.category.aggregate({
    where: { menuId },
    _max: { sortOrder: true },
  });
  let nextCatSort = (maxSortCat._max.sortOrder ?? -1) + 1;

  let createdCategories = 0;
  let createdItems = 0;

  await prisma.$transaction(async (tx) => {
    for (const cat of selectedCategories) {
      const items = cat.items.filter((i) => i.selected !== false);
      if (items.length === 0) continue;

      const category = await tx.category.create({
        data: {
          menuId,
          sortOrder: nextCatSort++,
          translations: {
            create: [
              { language: "GR", name: cat.nameGr.trim() },
              ...(cat.nameEn?.trim() ? [{ language: "EN" as const, name: cat.nameEn.trim() }] : []),
              ...(cat.nameDe?.trim() ? [{ language: "DE" as const, name: cat.nameDe.trim() }] : []),
              ...(cat.nameFr?.trim() ? [{ language: "FR" as const, name: cat.nameFr.trim() }] : []),
            ],
          },
        },
      });
      createdCategories += 1;

      let itemSort = 0;
      for (const item of items) {
        const nameRows = buildMenuNameTranslations({
          nameGr: item.nameGr.trim(),
          nameEn: item.nameEn,
          nameDe: item.nameDe,
          nameFr: item.nameFr,
        });
        await tx.item.create({
          data: {
            categoryId: category.id,
            price: item.price ?? 0,
            available: true,
            sortOrder: itemSort++,
            translations: {
              create: nameRows.map((row) => ({
                language: row.language,
                name: row.name,
                description: row.language === "GR" ? item.descriptionGr?.trim() || null : null,
              })),
            },
          },
        });
        createdItems += 1;
      }
    }
  });

  console.log(`\n✅ Imported ${createdItems} items in ${createdCategories} categories → menu ${menuId}`);
  console.log(`Customer: ${user.email} (${user.name ?? "—"})`);
}

main()
  .catch((err) => {
    console.error("\n❌ Import failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
