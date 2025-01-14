'use client';

import { insuranceCompanies } from '@/data/data';
import { Combobox } from './combobox';

interface CompanyComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CompanyCombobox({ value, onChange }: CompanyComboboxProps) {
  return <Combobox value={value} onChange={onChange} items={insuranceCompanies} placeholder='Select company...' searchPlaceholder='Search company...' groupHeading='Companies' />;
}
