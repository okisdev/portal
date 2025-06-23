import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { s3 } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    const extension = filename.split('.').pop();
    const uniqueFilename = `${nanoid()}.${extension}`;

    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: contentType,
      }),
      { expiresIn: 60 }
    );

    return NextResponse.json({
      url: signedUrl,
      key: uniqueFilename,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${err}` },
      { status: 500 }
    );
  }
}
