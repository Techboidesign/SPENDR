import type { ComponentProps, CSSProperties } from 'react';
import { useAppColors } from '../../context/AppearanceContext';
import { AUTH_THEME } from '../../theme/authTheme';
import { FormInput } from './FormFields';

const SYMBOL_PAD_LEFT = 34;

export function CurrencyAmountInput({
  currencySymbol,
  tone = 'light',
  style,
  className,
  ...props
}: ComponentProps<typeof FormInput> & {
  currencySymbol: string;
}) {
  const c = useAppColors();
  const isDark = tone === 'dark';

  const symbolStyle: CSSProperties = {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 16,
    fontWeight: 700,
    color: isDark ? AUTH_THEME.textMuted : c.textMuted,
    zIndex: 1,
    pointerEvents: 'none',
    lineHeight: 1,
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span aria-hidden style={symbolStyle}>
        {currencySymbol}
      </span>
      <FormInput
        tone={tone}
        className={className}
        style={{
          paddingLeft: SYMBOL_PAD_LEFT,
          ...style,
        }}
        {...props}
      />
    </div>
  );
}
