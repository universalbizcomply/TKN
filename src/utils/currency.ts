export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'JPY' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // relative to GBP (1 GBP = rate in target currency)
  label: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  GBP: { code: 'GBP', symbol: '£', rate: 1.0, label: 'GBP (£)', flag: '🇬🇧' },
  EUR: { code: 'EUR', symbol: '€', rate: 1.18, label: 'EUR (€)', flag: '🇪🇺' },
  USD: { code: 'USD', symbol: '$', rate: 1.28, label: 'USD ($)', flag: '🇺🇸' },
  JPY: { code: 'JPY', symbol: '¥', rate: 198.0, label: 'JPY (¥)', flag: '🇯🇵' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.74, label: 'CAD (CA$)', flag: '🇨🇦' },
};

export function formatMoney(amountInGBP: number, currency: CurrencyCode = 'GBP'): string {
  const conf = CURRENCIES[currency] || CURRENCIES.GBP;
  const converted = amountInGBP * conf.rate;
  
  if (currency === 'JPY') {
    return `${conf.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${conf.symbol}${converted.toFixed(2)}`;
}
