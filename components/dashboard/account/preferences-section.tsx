'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Combobox } from '@/components/shared/combobox';
import { Label } from '@/components/ui/label';
import { timezones } from '@/data/data';
import type { Timezone } from '@/lib/schema';
import { api } from '@/utils/trpc/client';

interface PreferencesSectionProps {
  initialTimezone?: Timezone;
}

export function PreferencesSection({
  initialTimezone = 'Asia/Hong_Kong',
}: PreferencesSectionProps) {
  const t = useTranslations();
  const updateTimezone = api.account.updateTimezone.useMutation();

  const [timezone, setTimezone] = useState<Timezone>(initialTimezone);

  useEffect(() => {
    if (initialTimezone) {
      setTimezone(initialTimezone);
    }
  }, [initialTimezone]);

  const handleTimezoneChange = async (value: Timezone) => {
    // Check if timezone has actually changed
    if (value === initialTimezone) {
      return;
    }

    try {
      await updateTimezone.mutateAsync(
        { timezone: value },
        {
          onSuccess: () => {
            setTimezone(value);
            toast.success(t('timezone_updated_successfully'));
          },
          onError: () => {
            toast.error(t('failed_to_update_timezone'));
          },
        }
      );
    } catch (error) {
      console.error('Failed to update timezone:', error);
    }
  };

  return (
    <div className='space-y-4'>
      <h2 className='font-medium text-xl tracking-tight'>{t('preferences')}</h2>

      <div className='space-y-2'>
        <Label htmlFor='timezone'>{t('timezone')}</Label>
        <Combobox
          allowCustom={false}
          emptyText={t('no_timezone_found')}
          groupHeading={t('timezones')}
          items={timezones.map((tz) => tz.value)}
          onChange={(value) => handleTimezoneChange(value as Timezone)}
          placeholder={t('select_timezone')}
          renderItem={(item) => (
            <div className='flex w-full items-center justify-between'>
              <span>
                {(() => {
                  const tz = timezones.find(
                    (timezoneItem) => timezoneItem.value === item
                  );
                  return tz ? `${tz.value} (${tz.code})` : item;
                })()}
              </span>
              {timezone === item && <Check className='h-4 w-4' />}
            </div>
          )}
          searchPlaceholder={t('search_timezone')}
          value={timezone}
        />
      </div>
    </div>
  );
}
