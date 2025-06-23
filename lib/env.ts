import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    AUTH_RESEND_KEY: z.string().min(1, 'AUTH_RESEND_KEY is required'),
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
    S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
    S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
    S3_ENDPOINT: z.string().min(1, 'S3_ENDPOINT is required'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL is required'),
    NEXT_PUBLIC_REACT_SCAN_API_KEY: z.string().min(1, 'NEXT_PUBLIC_REACT_SCAN_API_KEY is required'),
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().min(1, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID is required').optional(),
    NEXT_PUBLIC_S3_PUBLIC_URL: z.string().min(1, 'NEXT_PUBLIC_S3_PUBLIC_URL is required'),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_REACT_SCAN_API_KEY: process.env.NEXT_PUBLIC_REACT_SCAN_API_KEY,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  },
});
