/**
 * Smoke test for server-side PDF text extraction (pdf-parse + @napi-rs/canvas).
 * Usage: node scripts/test-pdf-extract.mjs [path-to.pdf]
 */
import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/test-pdf-extract.mjs <file.pdf>");
  process.exit(1);
}

const buffer = readFileSync(path);
const parser = new PDFParse({ data: new Uint8Array(buffer) });

try {
  const info = await parser.getInfo();
  console.log("pages:", info.total);
  const text = await parser.getText({ partial: [3], lineEnforce: true, pageJoiner: "\n" });
  console.log("page 3 chars:", text.text?.trim().length ?? 0);
  console.log("sample:", (text.text ?? "").slice(0, 200).replace(/\n/g, " "));
} finally {
  await parser.destroy().catch(() => undefined);
}
