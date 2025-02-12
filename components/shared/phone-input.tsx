'use client';

import { Combobox } from '@/components/shared/combobox';
import { Input } from '@/components/ui/input';
import { phoneCountries } from '@/data/data';
import { cn } from '@/lib/utils';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function PhoneInput({ className, value, onChange, onValidityChange, ...props }: PhoneInputProps) {
  const t = useTranslations();

  const [selectedCountry, setSelectedCountry] = useState<(typeof phoneCountries)[0] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateAndNotify = (number: string, shouldNotify = false) => {
    if (!selectedCountry) {
      setIsValid(false);
      onValidityChange?.(false);
      return;
    }

    try {
      const isNumberValid = isValidPhoneNumber(number);

      setIsValid(isNumberValid);
      onValidityChange?.(isNumberValid);

      if (shouldNotify && !isNumberValid && number.length > 0) {
        toast.error(t('invalid_phone_number', { number }));
      }
    } catch {
      setIsValid(false);
      onValidityChange?.(false);
      if (shouldNotify && number.length > 0) {
        toast.error(t('invalid_phone_number', { number }));
      }
    }
  };

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
          const numberWithoutCode = value.slice(detectedCode.length).trim();
          setPhoneNumber(numberWithoutCode);
          validateAndNotify(value, false);
          return;
        }
      }

      // If no country code detected or not matched, just set the number
      setSelectedCountry(null);
      setPhoneNumber(value);
      setIsValid(false);
      onValidityChange?.(false);
    } else {
      setSelectedCountry(null);
      setPhoneNumber('');
      setIsValid(false);
      onValidityChange?.(false);
    }
  }, [value, onValidityChange]);

  const handleCountryChange = (countryLabel: string) => {
    const country = phoneCountries.find((c) => c.label === countryLabel);
    setSelectedCountry(country || null);

    if (country) {
      const newValue = `${country.code} ${phoneNumber}`.trim();
      onChange(newValue);
      validateAndNotify(newValue, true);
    } else {
      onChange(phoneNumber);
      setIsValid(false);
      onValidityChange?.(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);

    if (selectedCountry) {
      const newValue = `${selectedCountry.code} ${newPhone}`.trim();
      onChange(newValue);
      validateAndNotify(newValue, false);
    } else {
      onChange(newPhone);
      setIsValid(false);
      onValidityChange?.(false);
    }
  };

  const handleBlur = () => {
    if (selectedCountry) {
      const fullNumber = `${selectedCountry.code} ${phoneNumber}`.trim();
      validateAndNotify(fullNumber, true);
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Combobox
        value={selectedCountry?.label ?? ''}
        onChange={handleCountryChange}
        items={phoneCountries.map((country) => country.label)}
        placeholder={t('select_country')}
        searchPlaceholder={t('search_country')}
        groupHeading={t('countries')}
        className='w-[180px]'
        allowCustom={false}
      />
      <Input
        type='tel'
        value={phoneNumber}
        onChange={handlePhoneChange}
        onBlur={handleBlur}
        className={cn('flex-1', isValid ? 'border-green-500 focus-visible:ring-green-500' : selectedCountry ? 'border-red-500 focus-visible:ring-red-500' : '')}
        placeholder={selectedCountry ? undefined : t('enter_phone_number')}
        {...props}
      />
    </div>
  );
}
