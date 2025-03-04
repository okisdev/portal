import { isValid, parse, startOfDay } from 'date-fns';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100); // Convert cents to dollars
};

export const parseDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;

  // Try different date formats
  const formats = [
    'dd/MM/yyyy', // 16/2/2025
    'MM/dd/yyyy', // 2/16/2025
    'yyyy-MM-dd', // 2025-02-16
    'yyyy/MM/dd', // 2025/02/16
    'dd-MM-yyyy', // 16-02-2025
    'MM-dd-yyyy', // 02-16-2025
    'dd.MM.yyyy', // 16.02.2025
    'MM.dd.yyyy', // 02.16.2025
  ];

  for (const formatString of formats) {
    try {
      const parsedDate = parse(dateString, formatString, new Date());
      if (isValid(parsedDate)) {
        return startOfDay(parsedDate); // Set time to midnight (00:00)
      }
    } catch (error) {
      // Continue to next format if parsing fails
    }
  }

  // If all parsing attempts fail, try native Date parsing as a fallback
  const fallbackDate = new Date(dateString);
  if (isValid(fallbackDate)) {
    return startOfDay(fallbackDate);
  }

  return undefined;
};

export const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName) return { firstName: '', lastName: '' };

  // Trim and remove extra spaces
  const cleanName = fullName.trim().replace(/\s+/g, ' ');

  // Check if it's a Chinese name (contains Chinese characters)
  if (/[\u4e00-\u9fa5]/.test(cleanName)) {
    // For Chinese names, first character is lastName, rest is firstName
    return {
      lastName: cleanName.charAt(0),
      firstName: cleanName.slice(1),
    };
  }

  // For western names, split by space
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    // If there are multiple parts, treat last part as lastName
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  }

  // If single word or unsure, use it as firstName
  return {
    firstName: cleanName,
    lastName: '',
  };
};
