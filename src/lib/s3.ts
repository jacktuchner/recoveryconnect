import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || "recovery-connect-media";

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generatePresignedUploadUrl(
  filename: string,
  contentType: string,
  userId: string
): Promise<PresignedUrlResult> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `recordings/${userId}/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export { s3Client, BUCKET_NAME };
