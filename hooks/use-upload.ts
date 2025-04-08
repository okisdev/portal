import ky from 'ky';
import { useState } from 'react';

interface UseUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (info: string) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadToS3 = async (data: Blob | File) => {
    try {
      setIsUploading(true);
      options.onProgress?.('Uploading audio to S3...');

      if (!data) {
        throw new Error('No audio data provided');
      }

      const response = await ky
        .post<{ url: string; key: string }>('/api/upload', {
          json: {
            filename: data instanceof File ? data.name : 'no-name',
            contentType: data.type || 'audio/webm',
          },
        })
        .json();

      const { url, key } = response;

      const uploadResponse = await ky.put(url, {
        body: data,
        headers: {
          'Content-Type': data.type || 'audio/webm',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      options.onProgress?.(`File uploaded to S3: ${key}`);
      options.onSuccess?.(key);

      return key;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('Upload error:', errorMessage);
      options.onProgress?.(`Upload error: ${errorMessage}`);
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToR2: uploadToS3,
    isUploading,
  };
}
