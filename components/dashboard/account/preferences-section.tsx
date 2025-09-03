'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Combobox } from '@/components/shared/combobox';
import { Label } from '@/components/ui/label';
import { timezones } from '@/data/data';
import type { Timezone } from '@/lib/schema';

interface PreferencesSectionProps {
  timezone: Timezone;
  onTimezoneChange: (value: Timezone) => void;
}

export function PreferencesSection({
  timezone,
  onTimezoneChange,
}: PreferencesSectionProps) {
  const t = useTranslations();

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
          onChange={(value) => onTimezoneChange(value as Timezone)}
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
