import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { useAppColors, useAppearance } from '../context/AppearanceContext';
import { bottomSheetChrome } from '../theme/modalSheet';
import { BottomSheetModal } from './BottomSheetModal';

export function AppBottomSheetLayout({
  open,
  onClose,
  title,
  titleSubline,
  headerLeading,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleSubline?: string;
  headerLeading?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();

  return (
    <BottomSheetModal open={open} onClose={onClose} sheetStyle={bottomSheetChrome(c)}>
      <div style={{ flexShrink: 0, padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? c.border : c.borderSubtle,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {headerLeading}
            <div style={{ minWidth: 0 }}>
              {titleSubline ? (
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 2 }}>
                  {titleSubline}
                </div>
              ) : null}
              <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.2 }}>
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              background: c.inputBg,
              border: `1px solid ${isDark ? c.inputBorder : c.border}`,
              borderRadius: 10,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} weight="bold" color={c.textMuted} />
          </button>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '0 20px 4px', overflow: 'hidden' }}>{children}</div>

      {footer}
    </BottomSheetModal>
  );
}
