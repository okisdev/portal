import { Download, FileIcon } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import { env } from '@/lib/env';
import 'react-medium-image-zoom/dist/styles.css';

export function AttachmentPreview({
  url,
  name,
  type,
}: {
  url: string;
  name: string;
  type: string;
}) {
  const s3Url = `${env.NEXT_PUBLIC_S3_PUBLIC_URL}/${url}`;
  // For image attachments
  if (type === 'image') {
    return (
      <div className='group relative overflow-hidden rounded-md border border-border'>
        <Zoom>
          <img
            alt={name}
            className='max-h-[300px] w-auto cursor-zoom-in object-contain'
            src={s3Url}
          />
        </Zoom>
        <div className='absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
          <a
            className='flex items-center justify-center rounded-full bg-background/80 p-1.5 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground'
            download
            href={s3Url}
            title='Download'
          >
            <Download className='h-4 w-4' />
          </a>
        </div>
        <div className='absolute right-0 bottom-0 left-0 truncate bg-background/80 p-1 text-xs'>
          {name}
        </div>
      </div>
    );
  }

  // For other file types
  return (
    <div className='flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs'>
      {type === 'video' ? (
        <div
          className='flex h-3 w-3 items-center justify-center'
          title='Video file'
        >
          <svg
            aria-hidden='true'
            className='h-3 w-3'
            fill='none'
            height='12'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
            width='12'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='m22 8-6 4 6 4V8Z' />
            <rect height='12' rx='2' ry='2' width='14' x='2' y='6' />
          </svg>
        </div>
      ) : type === 'audio' ? (
        <div
          className='flex h-3 w-3 items-center justify-center'
          title='Audio file'
        >
          <svg
            aria-hidden='true'
            className='h-3 w-3'
            fill='none'
            height='12'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
            width='12'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='M9 18V5l12-2v13' />
            <circle cx='6' cy='18' r='3' />
            <circle cx='18' cy='16' r='3' />
          </svg>
        </div>
      ) : (
        <FileIcon className='h-3 w-3' />
      )}
      <a
        className='max-w-[150px] truncate hover:underline'
        href={s3Url}
        rel='noopener noreferrer'
        target='_blank'
        title={name}
      >
        {name}
      </a>
      <a
        className='text-muted-foreground hover:text-foreground'
        download
        href={s3Url}
        title='Download'
      >
        <Download className='h-3 w-3' />
      </a>
    </div>
  );
}
