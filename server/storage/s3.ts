import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { logger } from "../utils/logger";

// Initialize S3 client (only if credentials are available)
const s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null;

const BUCKET = process.env.S3_BUCKET || "okapi-files";

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return s3Client !== null;
}

/**
 * Generate presigned URL for direct upload from browser
 */
export async function getUploadUrl(params: {
  facilityId: string;
  folder: string; // 'images', 'documents', 'forms'
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (!s3Client) {
    throw new Error("S3 not configured");
  }

  const ext = params.filename.split(".").pop() || "bin";
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const key = `facilities/${params.facilityId}/${params.folder}/${uniqueId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || "us-west-2"}.amazonaws.com/${key}`;

  logger.info({ facilityId: params.facilityId, key }, "Generated upload URL");

  return { uploadUrl, key, publicUrl };
}

/**
 * Generate presigned URL for download
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!s3Client) {
    throw new Error("S3 not configured");
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload buffer directly to S3
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!s3Client) {
    throw new Error("S3 not configured");
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || "us-west-2"}.amazonaws.com/${key}`;
  logger.info({ key }, "Uploaded file to S3");

  return publicUrl;
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  if (!s3Client) {
    throw new Error("S3 not configured");
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));

  logger.info({ key }, "Deleted file from S3");
}

/**
 * Check if file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  if (!s3Client) {
    return false;
  }

  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique key for a file
 */
export function generateFileKey(
  facilityId: string,
  folder: string,
  filename: string
): string {
  const ext = filename.split(".").pop() || "bin";
  const uniqueId = crypto.randomBytes(8).toString("hex");
  return `facilities/${facilityId}/${folder}/${uniqueId}.${ext}`;
}
