import { env } from '@/lib/env';
import { Download, FileIcon } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export function AttachmentPreview({ url, name, type }: { url: string; name: string; type: string }) {
  const s3Url = `${env.NEXT_PUBLIC_S3_PUBLIC_URL}/${url}`;
  // For image attachments
  if (type === 'image') {
    return (
      <div className='group relative overflow-hidden rounded-md border border-border'>
        <Zoom>
          <img src={s3Url} alt={name} className='max-h-[300px] object-contain w-auto cursor-zoom-in' />
        </Zoom>
        <div className='absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
          <a
            href={s3Url}
            download
            className='flex items-center justify-center rounded-full bg-background/80 p-1.5 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground'
            title='Download'
          >
            <Download className='h-4 w-4' />
          </a>
        </div>
        <div className='absolute right-0 bottom-0 left-0 truncate bg-background/80 p-1 text-xs'>{name}</div>
      </div>
    );
  }

  // For other file types
  return (
    <div className='flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs'>
      {type === 'video' ? (
        <div className='flex h-3 w-3 items-center justify-center' title='Video file'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-3 w-3'
            aria-hidden='true'
          >
            <path d='m22 8-6 4 6 4V8Z' />
            <rect width='14' height='12' x='2' y='6' rx='2' ry='2' />
          </svg>
        </div>
      ) : type === 'audio' ? (
        <div className='flex h-3 w-3 items-center justify-center' title='Audio file'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-3 w-3'
            aria-hidden='true'
          >
            <path d='M9 18V5l12-2v13' />
            <circle cx='6' cy='18' r='3' />
            <circle cx='18' cy='16' r='3' />
          </svg>
        </div>
      ) : (
        <FileIcon className='h-3 w-3' />
      )}
      <a href={s3Url} target='_blank' rel='noopener noreferrer' className='max-w-[150px] truncate hover:underline' title={name}>
        {name}
      </a>
      <a href={s3Url} download className='text-muted-foreground hover:text-foreground' title='Download'>
        <Download className='h-3 w-3' />
      </a>
    </div>
  );
}
