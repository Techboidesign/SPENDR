import { ComponentProps, CSSProperties } from 'react';
import type { AppColorPalette } from '../../theme/appColors';
import { Input } from '../ui/input';

/** Shared corner radius for onboarding + auth fields (inputs and selects). */
export const FORM_FIELD_RADIUS = 16;

const SELECT_CHEVRON_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'/%3E%3C/svg%3E")`;

const SELECT_CHEVRON_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'/%3E%3C/svg%3E")`;

const inputFieldExtras: CSSProperties = {
  boxSizing: 'border-box',
  paddingLeft: 16,
  paddingRight: 16,
  fontFamily: 'inherit',
};

export const formFieldStyle: CSSProperties = {
  width: '100%',
  height: 50,
  fontSize: 16,
  borderRadius: FORM_FIELD_RADIUS,
  border: '1px solid #3E37FF',
  borderColor: '#3E37FF',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderImage: 'none',
  outline: 'none',
  boxShadow: 'none',
  ...inputFieldExtras,
};

/** App modals/screens: shared overrides for `FormInput`, `CurrencyAmountInput`, `MonthYearFieldInput`. */
export function appFormFieldStyle(c: AppColorPalette): CSSProperties {
  return {
    borderColor: c.border,
    backgroundColor: c.surfaceAlt,
    color: c.text,
  };
}

export const formFieldStyleCompact: CSSProperties = {
  ...formFieldStyle,
  height: 32,
  fontSize: 13,
  borderRadius: 12,
  paddingLeft: 12,
  paddingRight: 12,
};

export const formFieldStyleDark: CSSProperties = {
  width: '100%',
  height: 50,
  fontSize: 16,
  borderRadius: FORM_FIELD_RADIUS,
  border: '1px solid rgba(255, 255, 255, 0.22)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#F8FAFC',
  outline: 'none',
  boxShadow: 'none',
  ...inputFieldExtras,
};

export const formFieldStyleCompactDark: CSSProperties = {
  ...formFieldStyleDark,
  height: 32,
  fontSize: 13,
  borderRadius: 12,
  paddingLeft: 12,
  paddingRight: 12,
};

const selectFieldExtras: CSSProperties = {
  paddingLeft: 14,
  paddingRight: 48,
  fontFamily: 'inherit',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '16px 16px',
};

export const formSelectStyle: CSSProperties = {
  ...formFieldStyle,
  ...selectFieldExtras,
  backgroundImage: SELECT_CHEVRON_LIGHT,
};

const inputClassName =
  'form-field bg-white border-[#3E37FF] shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#3E37FF]';

const formSelectStyleDark: CSSProperties = {
  ...formFieldStyleDark,
  ...selectFieldExtras,
  backgroundImage: SELECT_CHEVRON_DARK,
};

export function FormInput({
  style,
  className,
  tone = 'light',
  ...props
}: ComponentProps<typeof Input> & { tone?: 'light' | 'dark' }) {
  const isDark = tone === 'dark';
  if (isDark) {
    return (
      <input
        data-slot="input"
        className={className}
        style={{
          ...formFieldStyleDark,
          ...style,
        }}
        {...props}
      />
    );
  }
  return (
    <Input
      className={[inputClassName, className].filter(Boolean).join(' ') || undefined}
      style={{
        ...formFieldStyle,
        borderRadius: FORM_FIELD_RADIUS,
        ...style,
      }}
      {...props}
    />
  );
}

export function FormSelect({
  style,
  className,
  tone = 'light',
  ...props
}: ComponentProps<'select'> & { tone?: 'light' | 'dark' }) {
  const isDark = tone === 'dark';
  return (
    <select
      className={isDark ? undefined : ['form-field', className].filter(Boolean).join(' ')}
      style={{
        ...(isDark ? formSelectStyleDark : formSelectStyle),
        ...style,
      }}
      {...props}
    />
  );
}
