'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const phoneCountries = [
  { value: 'tw', label: '🇹🇼 +886', code: '+886' },
  { value: 'us', label: '🇺🇸 +1', code: '+1' },
  { value: 'cn', label: '🇨🇳 +86', code: '+86' },
  { value: 'jp', label: '🇯🇵 +81', code: '+81' },
  { value: 'kr', label: '🇰🇷 +82', code: '+82' },
  // Add more countries as needed
];

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ className, value, onChange, ...props }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(phoneCountries[0]);

  // Extract the phone number without country code
  const phoneWithoutCode = value.replace(/^\+\d+\s*/, '');

  const handleCountryChange = (countryValue: string) => {
    const country = phoneCountries.find((c) => c.value === countryValue);
    if (country) {
      setSelectedCountry(country);
      onChange(`${country.code} ${phoneWithoutCode}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    onChange(`${selectedCountry.code} ${newPhone}`);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Select value={selectedCountry.value} onValueChange={handleCountryChange}>
        <SelectTrigger className='w-[140px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {phoneCountries.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type='tel' value={phoneWithoutCode} onChange={handlePhoneChange} className='flex-1' {...props} />
    </div>
  );
}
