'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function EmailInput({
  className,
  value,
  onChange,
  onValidityChange,
  ...props
}: EmailInputProps) {
  const t = useTranslations();
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAndNotify = (email: string, shouldNotify = false) => {
    const isEmailValid = validateEmail(email);
    setIsValid(isEmailValid);
    onValidityChange?.(isEmailValid);

    if (shouldNotify && !isEmailValid && email.length > 0) {
      toast.error(t('invalid_email_address'));
    }
  };

  useEffect(() => {
    if (value) {
      validateAndNotify(value, false);
    } else {
      setIsValid(false);
      onValidityChange?.(false);
    }
  }, [value, onValidityChange]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    onChange(newEmail);
    validateAndNotify(newEmail, false);
  };

  const handleBlur = () => {
    validateAndNotify(value, true);
  };

  return (
    <Input
      type='email'
      value={value}
      onChange={handleEmailChange}
      onBlur={handleBlur}
      className={cn(
        className,
        value
          ? isValid
            ? 'border-green-500 focus-visible:ring-green-500'
            : 'border-red-500 focus-visible:ring-red-500'
          : ''
      )}
      placeholder={t('enter_email_address')}
      {...props}
    />
  );
}
