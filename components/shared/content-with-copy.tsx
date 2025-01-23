import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/clipboard';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function ContentWithCopy({ content, className }: { content: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} type='button' className={cn('flex items-center gap-2', className)}>
      {content}
      {copied ? <Check className='size-4 text-green-500' /> : <Copy className='size-4' />}
    </button>
  );
}
