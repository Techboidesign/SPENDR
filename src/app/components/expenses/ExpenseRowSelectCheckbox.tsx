import type { CSSProperties } from 'react';
import { Check } from '@phosphor-icons/react';

export const EXPENSE_SELECT_CHECKBOX_SIZE = 20;
export const EXPENSE_SELECT_CHECKBOX_RADIUS = 6;
export const EXPENSE_SELECT_BRAND = '#3E37FF';
const UNCHECKED_BORDER = '#D1D5DB';

/** Left-to-right wash behind a selected expense row (fades to surface). */
export function expenseRowSelectedBackground(surface: string, isDark: boolean): string {
  const peak = isDark ? 'rgba(62, 55, 255, 0.07)' : 'rgba(62, 55, 255, 0.05)';
  const mid = isDark ? 'rgba(62, 55, 255, 0.025)' : 'rgba(62, 55, 255, 0.0125)';
  return `linear-gradient(90deg, ${peak} 0%, ${mid} 40%, ${surface} 78%, ${surface} 100%)`;
}

export interface ExpenseRowSelectCheckboxProps {
  checked: boolean;
  style?: CSSProperties;
}

/** Single rounded square — same control for swipe affordance and multi-select rows. */
export function ExpenseRowSelectCheckbox({ checked, style }: ExpenseRowSelectCheckboxProps) {
  return (
    <div
      aria-hidden
      style={{
        width: EXPENSE_SELECT_CHECKBOX_SIZE,
        height: EXPENSE_SELECT_CHECKBOX_SIZE,
        borderRadius: EXPENSE_SELECT_CHECKBOX_RADIUS,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        backgroundColor: checked ? EXPENSE_SELECT_BRAND : 'transparent',
        border: `1.5px solid ${checked ? EXPENSE_SELECT_BRAND : UNCHECKED_BORDER}`,
        ...style,
      }}
    >
      {checked ? <Check size={12} weight="bold" color="#FFFFFF" /> : null}
    </div>
  );
}
