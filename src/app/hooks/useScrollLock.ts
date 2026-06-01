import { useEffect, type RefObject } from 'react';
import { APP_SCROLL_ATTR } from '../theme/screenScroll';

const SCROLL_SELECTOR = `[${APP_SCROLL_ATTR}]`;

function clearStaleScrollStyles(el: HTMLElement) {
  el.style.position = '';
  el.style.top = '';
  el.style.left = '';
  el.style.width = '';
  el.style.touchAction = '';
}

/** Restores a scroll root after modal close (safe to call anytime). */
export function releaseAppScrollElement(el: HTMLElement) {
  clearStaleScrollStyles(el);

  const scrollTop = Number(el.dataset.scrollLockTop ?? el.scrollTop);
  delete el.dataset.scrollLockTop;

  const savedOverflow = el.dataset.scrollLockOverflow;
  const savedOverflowY = el.dataset.scrollLockOverflowY;
  delete el.dataset.scrollLockOverflow;
  delete el.dataset.scrollLockOverflowY;

  if (savedOverflow !== undefined) {
    if (savedOverflow) el.style.overflow = savedOverflow;
    else el.style.removeProperty('overflow');
  } else {
    el.style.removeProperty('overflow');
  }

  if (savedOverflowY !== undefined) {
    if (savedOverflowY) el.style.overflowY = savedOverflowY;
    else el.style.removeProperty('overflow-y');
  } else {
    el.style.removeProperty('overflow-y');
  }

  el.style.removeProperty('overscroll-behavior');
  el.scrollTop = scrollTop;
}

function lockAppScrollElement(el: HTMLElement) {
  clearStaleScrollStyles(el);

  if (el.dataset.scrollLockTop === undefined) {
    el.dataset.scrollLockTop = String(el.scrollTop);
  }
  if (el.dataset.scrollLockOverflow === undefined) {
    el.dataset.scrollLockOverflow = el.style.overflow;
  }
  if (el.dataset.scrollLockOverflowY === undefined) {
    el.dataset.scrollLockOverflowY = el.style.overflowY;
  }

  el.style.overflow = 'hidden';
  el.style.overflowY = 'hidden';
  el.style.overscrollBehavior = 'none';
}

function getLockTargets(scrollRootRef?: RefObject<HTMLElement | null>): HTMLElement[] {
  if (scrollRootRef?.current) return [scrollRootRef.current];

  const shell = document.querySelector('.device-shell__content');
  if (shell) {
    const inShell = Array.from(
      shell.querySelectorAll<HTMLElement>(SCROLL_SELECTOR),
    );
    if (inShell.length > 0) return inShell;
  }

  return Array.from(document.querySelectorAll<HTMLElement>(SCROLL_SELECTOR));
}

/**
 * Locks scroll on marked roots while `locked` is true.
 * Only runs on the locked=true transition; releases in effect cleanup.
 */
export function useScrollLock(
  locked: boolean,
  scrollRootRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!locked) return;

    const elements = getLockTargets(scrollRootRef);
    elements.forEach(lockAppScrollElement);

    return () => {
      elements.forEach(releaseAppScrollElement);
    };
  }, [locked, scrollRootRef]);
}
