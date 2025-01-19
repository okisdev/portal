'use client';

import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NameTagProps {
  id: string;
  type: 'contact' | 'user';
  className?: string;
}

export function NameTag({ id, type, className }: NameTagProps) {
  const [displayName, setDisplayName] = useState<string>('Loading...');

  const { data: contact, isError: isContactError } = api.contact.getContactById.useQuery({ id }, { enabled: type === 'contact' });

  const { data: user, isError: isUserError } = api.user.getUserById.useQuery({ id }, { enabled: type === 'user' });

  useEffect(() => {
    if (type === 'contact') {
      if (isContactError) {
        toast.error('Error loading contact');
        return;
      }
      if (!contact) {
        setDisplayName('Loading...');
        return;
      }
      setDisplayName(contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact');
      return;
    }

    if (type === 'user') {
      if (isUserError) {
        toast.error('Error loading user');
        return;
      }
      if (user) {
        setDisplayName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User');
        return;
      }
      setDisplayName('Unknown User');
    }
  }, [type, id, contact, user, isContactError, isUserError]);

  if (type === 'contact') {
    return (
      <Link href={`/dashboard/crm/contacts/${id}`} className={cn(className, 'text-muted-foreground transition duration-100 ease-in-out hover:text-neutral-900')}>
        {displayName}
      </Link>
    );
  }

  return <span className={className}>{displayName}</span>;
}
