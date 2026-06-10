import { Backspace } from '@phosphor-icons/react';
import { useAppearance, useAppColors } from '../../context/AppearanceContext';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'] as const;

function appendDigit(current: string, digit: string): string {
  if (digit === '.') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : `${current}.`;
  }
  if (current === '0') return digit;
  const next = current + digit;
  const [, decimals] = next.split('.');
  if (decimals && decimals.length > 2) return current;
  if (next.replace('.', '').length > 9) return current;
  return next;
}

function backspace(current: string): string {
  if (current.length <= 1) return '';
  return current.slice(0, -1);
}

export function ExpenseAmountNumpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();

  const handleKey = (key: (typeof KEYS)[number]) => {
    if (key === 'backspace') {
      onChange(backspace(value));
      return;
    }
    onChange(appendDigit(value, key));
  };

  return (
    <div
      role="group"
      aria-label="Amount keypad"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}
    >
      {KEYS.map(key => {
        const isBackspace = key === 'backspace';
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            aria-label={isBackspace ? 'Delete digit' : key === '.' ? 'Decimal point' : key}
            style={{
              height: 48,
              borderRadius: 12,
              border: isDark ? `1px solid ${c.inputBorder}` : 'none',
              backgroundColor: c.inputBg,
              color: c.text,
              fontSize: isBackspace ? 0 : 22,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isBackspace ? (
              <Backspace size={22} weight="light" color={c.textMuted} aria-hidden />
            ) : (
              key
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Display string for the amount hero (always shows something readable). */
export function formatNumpadAmountDisplay(value: string): string {
  if (!value) return '0.00';
  if (value.endsWith('.')) return value;
  const parts = value.split('.');
  if (parts.length === 1) return `${value}.00`;
  const decimals = (parts[1] + '00').slice(0, 2);
  return `${parts[0]}.${decimals}`;
}
