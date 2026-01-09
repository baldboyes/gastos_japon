/**
 * Phone number formatting utilities
 */

/**
 * Format phone number by removing spaces and handling Spanish country code
 * - Removes all spaces from the number
 * - If number starts with 034 or 0034, replaces with +34
 * - If number doesn't start with + and looks like a Spanish number (9 digits), adds +34
 * - If number starts with +XX (any other country code), leaves it as is
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all spaces
  let cleaned = phone.replace(/\s/g, '')
  
  // Handle Spanish numbers that start with 034 or 0034
  if (cleaned.startsWith('034')) {
    cleaned = '+34' + cleaned.slice(3)
  } else if (cleaned.startsWith('0034')) {
    cleaned = '+34' + cleaned.slice(4)
  }
  
  // If number starts with +, it's already formatted with country code
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // If number has 9 digits and starts with 6, 7, 8, or 9, it's likely a Spanish mobile/landline
  if (/^[6789]\d{8}$/.test(cleaned)) {
    return '+34' + cleaned
  }
  
  // For any other number, return as is (without spaces)
  return cleaned
}

/**
 * Format phone number for href attribute (tel: links)
 * This ensures the phone number is properly formatted for click-to-call functionality
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number suitable for tel: links
 */
export function formatPhoneForHref(phone: string): string {
  const formatted = formatPhoneNumber(phone)
  // Ensure we have a proper international format for tel: links
  if (formatted.startsWith('+')) {
    return formatted
  }
  // If no country code and looks like Spanish number, add +34
  if (/^[6789]\d{8}$/.test(formatted)) {
    return '+34' + formatted
  }
  return formatted
}