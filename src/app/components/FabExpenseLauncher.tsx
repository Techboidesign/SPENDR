import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Plus, UploadSimple, X } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { useAppMotion } from '../hooks/useAppMotion';
import { FAB_COLOR_TRANSITION, FAB_ICON_SWAP_TRANSITION } from '../theme/motion';
export const FAB_SIZE = 68;
const FAB_BORDER = 2;
const SAT_SIZE = 52;
const SPREAD_X = 56;
const LIFT_Y = -46;
const CENTER_LIFT_EXTRA = 8;

export const FAB_CENTER_TOP =
  Math.max(0, FAB_SIZE * (0.5 - 0.2) - 20) + 10;

const MENU_AUTO_CLOSE_MS = 3000;

type FabSlot = 'camera' | 'edit' | 'upload';

const SLOTS: {
  id: FabSlot;
  label: string;
  Icon: typeof Camera;
  offsetX: number;
  offsetY: number;
}[] = [
  { id: 'camera', label: 'Take photo of receipt', Icon: Camera, offsetX: -SPREAD_X, offsetY: LIFT_Y },
  {
    id: 'edit',
    label: 'Add expense manually',
    Icon: Plus,
    offsetX: 0,
    offsetY: LIFT_Y - 10 - CENTER_LIFT_EXTRA,
  },
  { id: 'upload', label: 'Upload document', Icon: UploadSimple, offsetX: SPREAD_X, offsetY: LIFT_Y },
];

const TAP_TRANSITION = { duration: 0.1, ease: [0.4, 0, 0.2, 1] as const };
const POP_SCALE_FROM = 0.92;

function slotIndexFromX(dx: number): number {
  if (dx < -SPREAD_X * 0.45) return 0;
  if (dx > SPREAD_X * 0.45) return 2;
  return 1;
}

export function FabExpenseLauncher() {
  const { openAddModal, showAddModal, scanReceiptFromCamera, uploadReceiptDocuments, isParsingReceipt } =
    useApp();
  const c = useAppColors();
  const { reduceMotion, fabPopTransition, popScale } = useAppMotion();
  const brand = c.fab;
  const brandActive = c.accent;

  const [open, setOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoClose = useCallback(() => {
    if (autoCloseTimer.current) {
      window.clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearAutoClose();
    setOpen(false);
    setActiveSlot(null);
    setDragging(false);
    dragStart.current = null;
  }, [clearAutoClose]);

  const scheduleAutoClose = useCallback(() => {
    clearAutoClose();
    autoCloseTimer.current = window.setTimeout(closeMenu, MENU_AUTO_CLOSE_MS);
  }, [clearAutoClose, closeMenu]);

  useEffect(() => {
    if (showAddModal) closeMenu();
  }, [showAddModal, closeMenu]);

  useEffect(() => {
    if (!open) {
      clearAutoClose();
      return;
    }
    scheduleAutoClose();
    return clearAutoClose;
  }, [open, scheduleAutoClose, clearAutoClose]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (hubRef.current?.contains(target)) return;
      closeMenu();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, closeMenu]);

  const runSlot = useCallback(
    (slot: FabSlot) => {
      closeMenu();
      if (slot === 'edit') {
        openAddModal();
        return;
      }
      if (slot === 'camera') {
        requestAnimationFrame(() => {
          cameraRef.current?.click();
        });
        return;
      }
      requestAnimationFrame(() => {
        uploadRef.current?.click();
      });
    },
    [closeMenu, openAddModal],
  );

  const openMenu = () => {
    setOpen(true);
    scheduleAutoClose();
  };

  const handleHubClick = () => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  };

  const bumpAutoClose = () => {
    if (open) scheduleAutoClose();
  };

  const handleHubPointerDown = (e: React.PointerEvent) => {
    if (!open) return;
    e.stopPropagation();
    bumpAutoClose();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    const rect = hubRef.current?.getBoundingClientRect();
    if (rect) {
      const dx = e.clientX - (rect.left + rect.width / 2);
      setActiveSlot(slotIndexFromX(dx));
    }
  };

  const handleHubPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !open) return;
    bumpAutoClose();
    const rect = hubRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    setActiveSlot(slotIndexFromX(dx));
  };

  const handleHubPointerUp = (e: React.PointerEvent) => {
    if (!open) return;
    const start = dragStart.current;
    const moved =
      start &&
      (Math.abs(e.clientX - start.x) > 14 || Math.abs(e.clientY - start.y) > 14);

    if (dragging && activeSlot !== null && moved) {
      runSlot(SLOTS[activeSlot].id);
    }
    setDragging(false);
    setActiveSlot(null);
    dragStart.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await scanReceiptFromCamera(file);
  };

  const onUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) await uploadReceiptDocuments(files);
  };

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onCameraChange}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={onUploadChange}
      />

      <div
        ref={hubRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: FAB_CENTER_TOP,
          transform: 'translate(-50%, -50%)',
          zIndex: 52,
          width: FAB_SIZE + SPREAD_X * 2 + 24,
          height: FAB_SIZE + Math.abs(LIFT_Y) + CENTER_LIFT_EXTRA + 24,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {open &&
            SLOTS.map((slot, i) => {
              const isActive = activeSlot === i;
              const isHover = isActive && dragging;
              return (
                <motion.button
                  key={slot.id}
                  type="button"
                  initial={{
                    scale: POP_SCALE_FROM,
                    x: 0,
                    y: 0,
                    opacity: 0,
                  }}
                  animate={{
                    scale: isActive ? 1.14 : 1,
                    x: slot.offsetX,
                    y: slot.offsetY,
                    opacity: 1,
                  }}
                  exit={{
                    scale: POP_SCALE_FROM,
                    x: 0,
                    y: 0,
                    opacity: 0,
                  }}
                  transition={{
                    ...fabPopTransition,
                    delay: reduceMotion ? 0 : i * 0.02,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    runSlot(slot.id);
                  }}
                  onPointerEnter={() => {
                    bumpAutoClose();
                    if (dragging) setActiveSlot(i);
                  }}
                  aria-label={slot.label}
                  disabled={isParsingReceipt}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: -SAT_SIZE / 2,
                    marginTop: -SAT_SIZE / 2,
                    width: SAT_SIZE,
                    height: SAT_SIZE,
                    borderRadius: '50%',
                    border: `1px solid ${isHover ? '#FFFFFF' : 'rgba(255,255,255,0.95)'}`,
                    backgroundColor: isHover ? brandActive : brand,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? '0 10px 28px rgba(62, 55, 255, 0.55)'
                      : '0 6px 18px rgba(62, 55, 255, 0.38)',
                    pointerEvents: 'auto',
                    padding: 0,
                    transition: 'background-color 0.12s ease',
                  }}
                  whileHover={
                    !dragging && !reduceMotion
                      ? {
                          scale: 1.06,
                          backgroundColor: '#7068FF',
                        }
                      : undefined
                  }
                >
                  <slot.Icon size={22} weight="bold" color="#FFFFFF" />
                </motion.button>
              );
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={e => {
            e.stopPropagation();
            handleHubClick();
          }}
          onPointerDown={open ? handleHubPointerDown : undefined}
          onPointerMove={open ? handleHubPointerMove : undefined}
          onPointerUp={open ? handleHubPointerUp : undefined}
          onPointerCancel={open ? handleHubPointerUp : undefined}
          aria-label={open ? 'Close menu' : 'Add expense'}
          aria-expanded={open}
          disabled={isParsingReceipt}
          animate={{
            scale: open ? 0.92 : 1,
            backgroundColor: open ? c.surface : brand,
            boxShadow: open
              ? '0 4px 16px rgba(0, 0, 0, 0.12)'
              : '0 8px 28px rgba(62, 55, 255, 0.45), 0 2px 8px rgba(15, 23, 42, 0.15)',
          }}
          transition={{
            scale: TAP_TRANSITION,
            backgroundColor: FAB_COLOR_TRANSITION,
            boxShadow: FAB_COLOR_TRANSITION,
          }}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: -FAB_SIZE / 2,
            marginTop: -FAB_SIZE / 2,
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: '50%',
            border: `${FAB_BORDER}px solid rgba(255, 255, 255, 0.95)`,
            cursor: isParsingReceipt ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            padding: 0,
            touchAction: 'none',
          }}
        >
          <span
            style={{
              position: 'relative',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="sync" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={popScale.initial}
                  animate={popScale.animate}
                  exit={popScale.exit}
                  transition={FAB_ICON_SWAP_TRANSITION}
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={28} weight="bold" color={brand} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={popScale.initial}
                  animate={popScale.animate}
                  exit={popScale.exit}
                  transition={FAB_ICON_SWAP_TRANSITION}
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={30} weight="bold" color="#FFFFFF" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>

        {open && !dragging && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translateX(-50%)',
              marginTop: 4,
              fontSize: 10,
              fontWeight: 600,
              color: '#9CA3AF',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Hold center & drag to select
          </motion.p>
        )}
      </div>
    </>
  );
}
