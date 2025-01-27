'use client';

import { Combobox } from '@/components/shared/combobox';
import { Input } from '@/components/ui/input';
import { phoneCountries } from '@/data/data';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ className, value, onChange, ...props }: PhoneInputProps) {
  const t = useTranslations();

  const [selectedCountry, setSelectedCountry] = useState<(typeof phoneCountries)[0] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Try to detect country code from the value
    if (value) {
      // Check if value starts with a plus and numbers
      const countryCodeMatch = value.match(/^\+(\d+)/);
      if (countryCodeMatch) {
        const detectedCode = `+${countryCodeMatch[1]}`;
        const country = phoneCountries.find((c) => c.code === detectedCode);
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(value.slice(detectedCode.length).trim());
          return;
        }
      }

      // If no country code detected or not matched, just set the number
      setSelectedCountry(null);
      setPhoneNumber(value);
    } else {
      setSelectedCountry(null);
      setPhoneNumber('');
    }
  }, [value]);

  const handleCountryChange = (countryLabel: string) => {
    const country = phoneCountries.find((c) => c.label === countryLabel);
    setSelectedCountry(country || null);

    if (country) {
      onChange(`${country.code} ${phoneNumber}`.trim());
    } else {
      onChange(phoneNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);

    if (selectedCountry) {
      onChange(`${selectedCountry.code} ${newPhone}`.trim());
    } else {
      onChange(newPhone);
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Combobox
        value={selectedCountry?.label ?? ''}
        onChange={handleCountryChange}
        items={phoneCountries.map((country) => country.label)}
        placeholder='Select'
        searchPlaceholder='Search'
        groupHeading='Countries'
        className='w-[180px]'
        allowCustom={false}
      />
      <Input type='tel' value={phoneNumber} onChange={handlePhoneChange} className='flex-1' placeholder={selectedCountry ? undefined : t('enter_phone_number')} {...props} />
    </div>
  );
}
