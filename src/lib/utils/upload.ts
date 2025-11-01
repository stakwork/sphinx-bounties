import { env } from "@/lib/env";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function isS3Configured(): boolean {
  return !!(
    env.AWS_S3_BUCKET &&
    env.AWS_S3_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY
  );
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File must be JPEG, PNG, GIF, or WebP" };
  }

  return { valid: true };
}

export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    // @ts-expect-error - AWS SDK is an optional dependency
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
      ...(env.AWS_S3_ENDPOINT && { endpoint: env.AWS_S3_ENDPOINT }),
    });

    const key = `workspace-avatars/${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: "public-read",
      })
    );

    if (env.AWS_S3_ENDPOINT) {
      return `${env.AWS_S3_ENDPOINT}/${env.AWS_S3_BUCKET}/${key}`;
    }

    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${key}`;
  } catch {
    throw new Error("AWS SDK not installed. Run: npm install @aws-sdk/client-s3");
  }
}

export async function uploadToLocal(file: Buffer, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "workspace-avatars");

  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file);

  return `/uploads/workspace-avatars/${filename}`;
}

export async function uploadImage(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const ext = path.extname(originalName);
  const filename = `${randomUUID()}${ext}`;

  if (isS3Configured()) {
    return uploadToS3(file, filename, contentType);
  }

  return uploadToLocal(file, filename);
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  return `${randomUUID()}${ext}`;
}
