import type { CSSProperties } from 'react';
import type { AppColorPalette } from './appColors';

export function bottomSheetChrome(c: AppColorPalette): CSSProperties {
  return {
    backgroundColor: c.modalSheet,
    borderRadius: '24px 24px 0 0',
    padding: 0,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overscrollBehavior: 'none',
    boxShadow: c.shadow,
  };
}
