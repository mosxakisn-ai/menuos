import sharp from "sharp";

const OCR_MAX_BYTES = 980_000;

async function createPdfParser(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  return new PDFParse({ data: new Uint8Array(buffer) });
}

/** Render one PDF page to JPEG, compressed for OCR.space free tier (~1MB). */
export async function renderPdfPageToJpeg(buffer: Buffer, pageNumber: number): Promise<Buffer> {
  const parser = await createPdfParser(buffer);
  try {
    const shot = await parser.getScreenshot({
      partial: [pageNumber],
      desiredWidth: 2200,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const raw = shot.pages[0]?.data;
    if (!raw?.length) {
      throw new Error(`No screenshot for page ${pageNumber}`);
    }

    let width = 1600;
    let quality = 82;
    let jpeg = await sharp(Buffer.from(raw)).jpeg({ quality, mozjpeg: true }).toBuffer();

    while (jpeg.length > OCR_MAX_BYTES && (quality > 45 || width > 800)) {
      if (quality > 45) {
        quality -= 8;
      } else {
        width = Math.round(width * 0.85);
      }
      jpeg = await sharp(Buffer.from(raw))
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: Math.max(45, quality), mozjpeg: true })
        .toBuffer();
    }

    if (jpeg.length > OCR_MAX_BYTES) {
      throw new Error(`Page ${pageNumber} image still too large after compression`);
    }

    return jpeg;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
