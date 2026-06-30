export function isR2Enabled(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_PUBLIC_URL?.trim(),
  );
}

export function getR2Bucket(): string {
  return process.env.R2_BUCKET!.trim();
}

export function getR2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL!.trim().replace(/\/$/, "");
  return `${base}/${key}`;
}

export function getR2Endpoint(): string {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return `https://${accountId}.r2.cloudflarestorage.com`;
}
