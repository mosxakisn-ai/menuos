import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2Bucket, getR2Endpoint } from "@/lib/r2-config";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: getR2Endpoint(),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
      },
    });
  }
  return client;
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function downloadFromR2(key: string): Promise<Buffer | null> {
  try {
    const res = await getR2Client().send(
      new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}
