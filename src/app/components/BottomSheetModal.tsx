import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAppMotion } from '../hooks/useAppMotion';
import { useScrollLock } from '../hooks/useScrollLock';
import { MODAL_ANIMATION_MS, MODAL_TRANSITION } from '../theme/motion';

export { MODAL_ANIMATION_MS, MODAL_TRANSITION } from '../theme/motion';

export const MODAL_HOST_ID = 'app-modal-host';

/** Above tab bar (50), FAB (52), and pickers (400). */
export const MODAL_OVERLAY_Z = 1000;

export function BottomSheetModal({
  open,
  onClose,
  children,
  zIndex = 200,
  sheetStyle,
  scrollLockRef,
  lockBackgroundScroll = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  sheetStyle?: CSSProperties;
  scrollLockRef?: RefObject<HTMLElement | null>;
  /** When false, background scroll is not locked (rare; prefer marking scroll roots with data-app-scroll). */
  lockBackgroundScroll?: boolean;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { modalTransition, sheetMotion, backdropMotion } = useAppMotion();

  useScrollLock(lockBackgroundScroll && open, scrollLockRef);

  useEffect(() => {
    setHost(document.getElementById(MODAL_HOST_ID));
  }, []);

  useEffect(() => {
    if (open) setHost(document.getElementById(MODAL_HOST_ID));
  }, [open]);

  useEffect(() => {
    const el = backdropRef.current;
    if (!open || !el) return;
    const blockTouchScroll = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', blockTouchScroll, { passive: false });
    return () => el.removeEventListener('touchmove', blockTouchScroll);
  }, [open]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            ref={backdropRef}
            key="modal-backdrop"
            role="presentation"
            initial={backdropMotion.initial}
            animate={backdropMotion.animate}
            exit={backdropMotion.exit}
            transition={modalTransition}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              touchAction: 'none',
              overscrollBehavior: 'none',
              pointerEvents: 'auto',
            }}
            onClick={onClose}
          />
          <motion.div
            key="modal-sheet"
            role="dialog"
            initial={sheetMotion.initial}
            animate={sheetMotion.animate}
            exit={sheetMotion.exit}
            transition={modalTransition}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: zIndex + 1,
              pointerEvents: 'auto',
              overscrollBehavior: 'none',
              ...sheetStyle,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (host) return createPortal(overlay, host);
  return overlay;
}
