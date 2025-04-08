import { env } from '@/lib/env';
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'auto',
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});
