import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';

export const MODAL_ANIMATION_MS = 0.3;

export const MODAL_TRANSITION = {
  duration: MODAL_ANIMATION_MS,
  ease: [0.32, 0.72, 0, 1] as const,
};

export const MODAL_HOST_ID = 'app-modal-host';

export function BottomSheetModal({
  open,
  onClose,
  children,
  zIndex = 200,
  sheetStyle,
  scrollLockRef,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  sheetStyle?: CSSProperties;
  scrollLockRef?: RefObject<HTMLElement | null>;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useScrollLock(open, scrollLockRef);

  useEffect(() => {
    setHost(document.getElementById(MODAL_HOST_ID));
  }, []);

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={MODAL_TRANSITION}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: zIndex + 1,
              pointerEvents: 'auto',
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
