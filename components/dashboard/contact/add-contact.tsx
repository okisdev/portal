import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Import, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function AddContact({ isLoading }: { isLoading: boolean }) {
  const router = useRouter();

  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='flex h-8 items-center gap-2'
          disabled={isLoading}
        >
          {t('add_contact')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => router.push('/dashboard/crm/contacts/new?mode=manual')}
        >
          <Import className='mr-2 h-4 w-4' />
          {t('manual')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => router.push('/dashboard/crm/contacts/new?mode=upload')}
        >
          <Upload className='mr-2 h-4 w-4' />
          {t('upload')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
