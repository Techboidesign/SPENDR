import { useRef, useState, type CSSProperties } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { MODAL_OVERLAY_Z } from '../BottomSheetModal';
import { useAppColors } from '../../context/AppearanceContext';
import { AUTH_THEME } from '../../theme/authTheme';
import { monthPickerLabel } from '../../utils/periods';
import { appFormFieldStyle, formFieldStyle, formFieldStyleDark } from './FormFields';
import { MonthYearPickerDropdown } from './MonthYearPickerDropdown';

const ICON_INSET_LEFT = 16;
const ICON_PAD_LEFT = 44;

/** Month/year field — same chrome as `FormInput` / `CurrencyAmountInput`; opens `MonthYearPickerDropdown`. */
export function MonthYearFieldInput({
  monthKey,
  onMonthChange,
  tone = 'light',
  disabled = false,
  style,
  minDate,
  maxDate,
  dropdownZIndex = MODAL_OVERLAY_Z + 50,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  tone?: 'light' | 'dark';
  disabled?: boolean;
  style?: CSSProperties;
  minDate?: Date;
  maxDate?: Date;
  dropdownZIndex?: number;
}) {
  const c = useAppColors();
  const isDark = tone === 'dark';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fieldRef = useRef<HTMLButtonElement>(null);

  const baseStyle = isDark ? formFieldStyleDark : formFieldStyle;
  const resolvedStyle = style ?? (tone === 'light' && !isDark ? appFormFieldStyle(c) : undefined);
  const iconColor = isDark ? AUTH_THEME.textMuted : c.textMuted;
  const display = monthPickerLabel(monthKey);

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        <CalendarBlank
          size={18}
          weight="light"
          color={iconColor}
          aria-hidden
          style={{
            position: 'absolute',
            left: ICON_INSET_LEFT,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <button
          ref={fieldRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setDropdownOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={dropdownOpen}
          aria-label={`${display}, choose month`}
          style={{
            ...baseStyle,
            width: '100%',
            margin: 0,
            paddingLeft: ICON_PAD_LEFT,
            paddingRight: 16,
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontWeight: 500,
            ...resolvedStyle,
            ...(!isDark ? { borderColor: c.accent } : null),
          }}
        >
          {display}
        </button>
      </div>

      {dropdownOpen && !disabled ? (
        <MonthYearPickerDropdown
          monthKey={monthKey}
          onChange={key => {
            onMonthChange(key);
            setDropdownOpen(false);
          }}
          onClose={() => setDropdownOpen(false)}
          anchorRect={fieldRef.current?.getBoundingClientRect() ?? null}
          fullWidth
          minDate={minDate}
          maxDate={maxDate}
          zIndex={dropdownZIndex}
        />
      ) : null}
    </>
  );
}
