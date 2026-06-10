import type { CSSProperties, ReactNode, RefObject } from 'react';
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
  headerTrailing,
  children,
  footer,
  scrollLockRef,
  lockBackgroundScroll,
  bodyScroll = false,
  sheetStyle,
  showCloseButton = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleSubline?: string;
  headerLeading?: ReactNode;
  /** Right side of title row (e.g. summary badges). Shown instead of close when both apply. */
  headerTrailing?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  scrollLockRef?: RefObject<HTMLElement | null>;
  lockBackgroundScroll?: boolean;
  /** Scrollable body when content exceeds sheet height (footer stays pinned). */
  bodyScroll?: boolean;
  /** Merged onto default bottom sheet chrome (e.g. taller max height). */
  sheetStyle?: CSSProperties;
  /** Header top-right close icon (use false when footer has explicit cancel action). */
  showCloseButton?: boolean;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      sheetStyle={{ ...bottomSheetChrome(c), ...sheetStyle }}
      scrollLockRef={scrollLockRef}
      lockBackgroundScroll={lockBackgroundScroll}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
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
          {headerTrailing ? (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{headerTrailing}</div>
          ) : showCloseButton ? (
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
          ) : null}
        </div>
      </div>

      <div
        style={
          bodyScroll
            ? {
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 24px',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
              }
            : { flexShrink: 0, padding: '0 20px 20px', overflow: 'hidden' }
        }
      >
        {children}
      </div>

      {footer}
      </div>
    </BottomSheetModal>
  );
}
