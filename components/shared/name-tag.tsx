'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';

interface NameTagProps {
  id: string;
  type: 'contact' | 'user';
  className?: string;
}

export function NameTag({ id, type, className }: NameTagProps) {
  const [displayName, setDisplayName] = useState<string>('Loading...');

  const {
    data: contact,
    isError: isContactError,
    isLoading: isContactLoading,
  } = api.contact.getContactById.useQuery(
    { id },
    { enabled: type === 'contact' }
  );

  const {
    data: user,
    isError: isUserError,
    isLoading: isUserLoading,
  } = api.user.getUserById.useQuery({ id }, { enabled: type === 'user' });

  useEffect(() => {
    if (isContactLoading || isUserLoading) {
      setDisplayName('Loading...');
      return;
    }

    if (type === 'contact') {
      if (isContactError) {
        toast.error('Error loading contact');
        setDisplayName('Error');
        return;
      }
      if (!contact) {
        setDisplayName('Loading...');
        return;
      }
      setDisplayName(
        contact.name ||
          `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
          'Unknown Contact'
      );
      return;
    }

    if (type === 'user') {
      if (isUserError) {
        toast.error('Error loading user');
        setDisplayName('Error');
        return;
      }
      if (!user) {
        setDisplayName('Unknown User');
        return;
      }
      setDisplayName(
        user.name ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email ||
          'Unknown User'
      );
    }
  }, [
    type,
    id,
    contact,
    user,
    isContactError,
    isUserError,
    isContactLoading,
    isUserLoading,
  ]);

  if (isContactLoading || isUserLoading) {
    return <Skeleton className={cn(className, 'h-4 w-20')} />;
  }

  if (type === 'contact') {
    return (
      <Link
        href={`/dashboard/crm/contacts/${id}`}
        className={cn(
          className,
          'text-muted-foreground underline transition duration-100 ease-in-out hover:text-neutral-900'
        )}
      >
        {displayName}
      </Link>
    );
  }

  return <span className={className}>{displayName}</span>;
}
