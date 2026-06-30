import sharp from "sharp";

/** Resize + WebP for menu dish photos (max 1200px, quality ~82). */
export async function optimizeMenuPhoto(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
