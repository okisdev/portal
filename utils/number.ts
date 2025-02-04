import { isValidPhoneNumber, parsePhoneNumberFromString, parsePhoneNumberWithError } from 'libphonenumber-js';

export function normalizePhoneNumber(phoneNumber: string) {
  const cleanedNumber = phoneNumber.replace(/\D/g, '');

  if (!isValidPhoneNumber(cleanedNumber)) {
    throw new Error('Invalid phone number');
  }

  const parsedNumber = parsePhoneNumberWithError(phoneNumber);

  return parsedNumber.format('E.164').replace('+', '');
}

export function formatPhoneNumber(phoneNumber: string) {
  // Ensure the phone number is in the correct format (e.g., starting with the country code)
  if (!/^\d{1,15}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }

  // Parse the phone number using the country code from the number
  const parsedNumber = parsePhoneNumberFromString(phoneNumber, { extract: true });

  if (!parsedNumber) {
    throw new Error('Invalid phone number');
  }

  // Return the phone number in international format
  return parsedNumber.formatInternational();
}
