import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { ResourceContent } from '@/lib/schema';
import { PlusCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContentListProps {
  contents?: { resourceContent: ResourceContent }[];
  currentContent: ResourceContent | null;
  isLoading: boolean;
  onNewContent: () => void;
}

export function ContentSideList({ contents, currentContent, isLoading, onNewContent }: ContentListProps) {
  const router = useRouter();
  const t = useTranslations();

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='w-1/3 border-r p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <PageHeader title={t('contents')} />
        <Button variant='outline' className='h-8' onClick={onNewContent}>
          <PlusCircle className='h-4 w-4' />
          {t('new')}
        </Button>
      </div>

      <div className='relative mb-4'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder={t('search_contents')} className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <ScrollArea className='h-[calc(100vh-200px)]'>
        {isLoading ? (
          <div className='flex h-full flex-col items-center justify-center space-y-2'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
        ) : (
          contents?.map((item) => (
            <button
              type='button'
              key={item.resourceContent.id}
              className={`mb-2 w-full cursor-pointer rounded-lg p-4 text-left transition-colors hover:bg-accent/50 ${currentContent?.id === item.resourceContent.id ? 'bg-accent' : ''}`}
              onClick={() => {
                router.push(`?id=${item.resourceContent.id}`);
              }}
            >
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>{item.resourceContent.title}</h3>
                <Badge variant={item.resourceContent.visibility === 'PUBLIC' ? 'default' : item.resourceContent.visibility === 'SHARED' ? 'secondary' : 'outline'}>
                  {item.resourceContent.visibility.toLowerCase()}
                </Badge>
              </div>
              <p className='text-muted-foreground text-sm'>{item.resourceContent.description}</p>
              <p className='mt-2 text-muted-foreground text-xs'>Created: {new Date(item.resourceContent.createdAt).toLocaleDateString()}</p>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
