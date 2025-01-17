'use client';

import { Combobox } from '@/components/shared/combobox';
import { Input } from '@/components/ui/input';
import { phoneCountries } from '@/data/data';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ className, value, onChange, ...props }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(phoneCountries.find((c) => c.code === '+852'));

  // Extract the phone number without country code
  const phoneWithoutCode = value.replace(/^\+\d+\s*/, '');

  const handleCountryChange = (countryLabel: string) => {
    const country = phoneCountries.find((c) => c.label === countryLabel);
    if (country) {
      setSelectedCountry(country);
      onChange(`${country.code} ${phoneWithoutCode}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    onChange(`${selectedCountry?.code} ${newPhone}`);
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
        className='w-[140px]'
        allowCustom={false}
      />
      <Input type='tel' value={phoneWithoutCode} onChange={handlePhoneChange} className='flex-1' {...props} />
    </div>
  );
}
