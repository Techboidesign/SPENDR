import { useEffect, type RefObject } from 'react';

const SCROLL_SELECTOR = '[data-app-scroll]';

type SavedStyles = {
  position: string;
  top: string;
  left: string;
  width: string;
  overflow: string;
  touchAction: string;
};

type Snapshot = {
  el: HTMLElement;
  scrollTop: number;
  saved: SavedStyles;
};

function lockElement(el: HTMLElement): Snapshot {
  const scrollTop = el.scrollTop;
  const saved: SavedStyles = {
    position: el.style.position,
    top: el.style.top,
    left: el.style.left,
    width: el.style.width,
    overflow: el.style.overflow,
    touchAction: el.style.touchAction,
  };

  const rect = el.getBoundingClientRect();

  el.style.position = 'fixed';
  el.style.top = `${-scrollTop}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.overflow = 'hidden';
  el.style.touchAction = 'none';

  return { el, scrollTop, saved };
}

function unlockElement({ el, scrollTop, saved }: Snapshot) {
  el.style.position = saved.position;
  el.style.top = saved.top;
  el.style.left = saved.left;
  el.style.width = saved.width;
  el.style.overflow = saved.overflow;
  el.style.touchAction = saved.touchAction;
  el.scrollTop = scrollTop;
}

export function useScrollLock(
  locked: boolean,
  scrollRootRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!locked) return;

    const elements = scrollRootRef?.current
      ? [scrollRootRef.current]
      : Array.from(document.querySelectorAll<HTMLElement>(SCROLL_SELECTOR));

    const snapshots = elements.map(lockElement);

    return () => {
      snapshots.forEach(unlockElement);
    };
  }, [locked, scrollRootRef]);
}
