import { type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { MonthPicker } from '../ui/monthpicker';
import {
  MONTH_PICKER_MAX_DATE,
  MONTH_PICKER_MIN_DATE,
  monthKeyToDate,
  toYearMonthKey,
} from '../../utils/periods';

const PICKER_Z = 500;
const BACKDROP_Z = 499;

type MonthYearPickerDropdownProps = {
  monthKey: string;
  onChange: (key: string) => void;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  fullWidth?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

export function MonthYearPickerDropdown({
  monthKey,
  onChange,
  onClose,
  anchorRect,
  fullWidth = false,
  minDate = MONTH_PICKER_MIN_DATE,
  maxDate = MONTH_PICKER_MAX_DATE,
}: MonthYearPickerDropdownProps) {
  const selectedMonth = monthKeyToDate(monthKey);

  const panelStyle: CSSProperties = anchorRect
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: fullWidth ? anchorRect.left : Math.max(12, anchorRect.left),
        width: fullWidth
          ? anchorRect.width
          : Math.min(300, Math.max(anchorRect.width, 280)),
        zIndex: PICKER_Z,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300,
        zIndex: PICKER_Z,
      };

  return createPortal(
    <>
      <div
        role="presentation"
        style={{ position: 'fixed', inset: 0, zIndex: BACKDROP_Z }}
        onClick={onClose}
      />
      <div role="dialog" aria-label="Choose month" style={panelStyle}>
        <div
          className="overflow-hidden rounded-2xl border border-[#F0F0F5] bg-white shadow-[0_12px_40px_rgba(26,26,46,0.14)]"
        >
          <MonthPicker
            selectedMonth={selectedMonth}
            minDate={minDate}
            maxDate={maxDate}
            onMonthSelect={date => {
              onChange(toYearMonthKey(date));
              onClose();
            }}
            variant={{
              calendar: { main: 'ghost', selected: 'default' },
              chevrons: 'outline',
            }}
            className="w-full"
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
