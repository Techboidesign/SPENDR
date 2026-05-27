/** Display symbol for a currency code (matches Settings / onboarding options). */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'JPY':
      return '¥';
    case 'CAD':
      return 'C$';
    case 'AUD':
      return 'A$';
    default:
      return '$';
  }
}
