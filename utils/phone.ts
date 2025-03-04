import { parsePhoneNumberWithError } from 'libphonenumber-js';

/**
 * Parses a phone number string into country code and number format
 * @param phone - Phone number string (e.g., "85288888888")
 * @returns Formatted phone number with country code (e.g., "+852 88888888")
 */
export const parsePhone = (phone: string): string => {
  try {
    // Add a '+' prefix if not present to help with parsing
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumberWithError(phoneWithPlus);
    if (!phoneNumber) {
      return phone;
    }
    return phoneNumber.formatInternational();
  } catch (error) {
    return phone;
  }
};

/**
 * Converts a formatted phone number back to a plain string
 * @param phone - Formatted phone number (e.g., "+852 88888888")
 * @returns Plain phone number string (e.g., "85288888888")
 */
export const stringifyPhone = (phone: string): string => {
  try {
    const phoneNumber = parsePhoneNumberWithError(phone);
    if (!phoneNumber) {
      return phone.replace(/[^0-9]/g, '');
    }
    // Return the full number including country code without any formatting
    return phoneNumber.countryCallingCode + phoneNumber.nationalNumber;
  } catch (error) {
    // Fallback: remove all non-numeric characters
    return phone.replace(/[^0-9]/g, '');
  }
};
