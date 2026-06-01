import type { CSSProperties } from 'react';
import { TAB_BAR_CLEARANCE } from '../components/BottomTabBar';
import type { AppColorPalette } from './appColors';

/** Marks the main route scrollport for modal scroll lock. */
export const APP_SCROLL_ATTR = 'data-app-scroll';

export function screenScrollRootStyle(
  c: AppColorPalette,
  options?: { padForTabBar?: boolean },
): CSSProperties {
  return {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'none',
    backgroundColor: c.canvas,
    WebkitOverflowScrolling: 'touch',
    ...(options?.padForTabBar !== false ? { paddingBottom: TAB_BAR_CLEARANCE } : {}),
  };
}
