import type { Icon } from '@phosphor-icons/react';
import {
  CurrencyCircleDollar,
  CurrencyDollar,
  CurrencyEur,
  CurrencyGbp,
  CurrencyJpy,
} from '@phosphor-icons/react';

export const CURRENCY_ICON_MAP: Record<string, Icon> = {
  EUR: CurrencyEur,
  USD: CurrencyDollar,
  GBP: CurrencyGbp,
  CHF: CurrencyCircleDollar,
  JPY: CurrencyJpy,
  CAD: CurrencyDollar,
  AUD: CurrencyDollar,
};

export function getCurrencyIcon(currency: string): Icon {
  return CURRENCY_ICON_MAP[currency] ?? CurrencyCircleDollar;
}
