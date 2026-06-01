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
/** Center “add manually” satellite — slightly larger than camera / upload */
const EDIT_SAT_SIZE = 62;
const SPREAD_X = 72;
const LIFT_Y = -52;
const CENTER_LIFT_EXTRA = 10;

export const FAB_CENTER_TOP =
  Math.max(0, FAB_SIZE * (0.5 - 0.2) - 20) + 10;

type FabSlot = 'camera' | 'edit' | 'upload';

const SLOTS: {
  id: FabSlot;
  label: string;
  Icon: typeof Camera;
  offsetX: number;
  offsetY: number;
  size: number;
  iconSize: number;
}[] = [
  {
    id: 'camera',
    label: 'Take photo of receipt',
    Icon: Camera,
    offsetX: -SPREAD_X,
    offsetY: LIFT_Y,
    size: SAT_SIZE,
    iconSize: 22,
  },
  {
    id: 'edit',
    label: 'Add expense manually',
    Icon: Plus,
    offsetX: 0,
    offsetY: LIFT_Y - 10 - CENTER_LIFT_EXTRA,
    size: EDIT_SAT_SIZE,
    iconSize: 26,
  },
  {
    id: 'upload',
    label: 'Upload document',
    Icon: UploadSimple,
    offsetX: SPREAD_X,
    offsetY: LIFT_Y,
    size: SAT_SIZE,
    iconSize: 22,
  },
];

const TAP_TRANSITION = { duration: 0.1, ease: [0.4, 0, 0.2, 1] as const };
const POP_SCALE_FROM = 0.92;

/** Pick satellite from hub-center delta while finger is held (options sit above the FAB). */
function slotIndexFromDelta(dx: number, dy: number): number | null {
  if (dy > 10) return null;

  if (dx < -SPREAD_X * 0.38) return 0;
  if (dx > SPREAD_X * 0.38) return 2;
  if (dy < -14) return 1;

  return null;
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
  const [pressing, setPressing] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveSlot(null);
    setPressing(false);
  }, []);

  useEffect(() => {
    if (showAddModal) closeMenu();
  }, [showAddModal, closeMenu]);

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

  const updateActiveSlotFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = hubRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    setActiveSlot(slotIndexFromDelta(dx, dy));
  }, []);

  const handleHubPointerDown = (e: React.PointerEvent) => {
    if (isParsingReceipt) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressing(true);
    setOpen(true);
    updateActiveSlotFromPointer(e.clientX, e.clientY);
  };

  const handleHubPointerMove = (e: React.PointerEvent) => {
    if (!pressing) return;
    updateActiveSlotFromPointer(e.clientX, e.clientY);
  };

  const finishPress = (e: React.PointerEvent) => {
    if (!pressing) return;

    const rect = hubRef.current?.getBoundingClientRect();
    let slot: number | null = activeSlot;
    if (rect) {
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      slot = slotIndexFromDelta(dx, dy);
    }

    if (slot !== null) {
      runSlot(SLOTS[slot].id);
    } else {
      closeMenu();
    }

    setPressing(false);
    setActiveSlot(null);
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
          width: FAB_SIZE + SPREAD_X * 2 + 32,
          height: FAB_SIZE + Math.abs(LIFT_Y) + CENTER_LIFT_EXTRA + EDIT_SAT_SIZE,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {open &&
            SLOTS.map((slot, i) => {
              const isActive = activeSlot === i;
              const sat = slot.size;
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
                    scale: isActive ? 1.12 : 1,
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
                    delay: reduceMotion ? 0 : i * 0.015,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    runSlot(slot.id);
                  }}
                  aria-label={slot.label}
                  disabled={isParsingReceipt}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: -sat / 2,
                    marginTop: -sat / 2,
                    width: sat,
                    height: sat,
                    borderRadius: '50%',
                    border: `1px solid ${isActive ? '#FFFFFF' : 'rgba(255,255,255,0.95)'}`,
                    backgroundColor: isActive ? brandActive : brand,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? '0 10px 28px rgba(62, 55, 255, 0.55)'
                      : '0 6px 18px rgba(62, 55, 255, 0.38)',
                    pointerEvents: pressing ? 'none' : 'auto',
                    padding: 0,
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  <slot.Icon size={slot.iconSize} weight="bold" color="#FFFFFF" />
                </motion.button>
              );
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          onPointerDown={handleHubPointerDown}
          onPointerMove={handleHubPointerMove}
          onPointerUp={finishPress}
          onPointerCancel={finishPress}
          aria-label={open ? 'Choose expense action' : 'Add expense'}
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={isParsingReceipt}
          animate={{
            scale: pressing ? 0.9 : 1,
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
            userSelect: 'none',
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

        {open && pressing && (
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
            Drag up to choose
          </motion.p>
        )}
      </div>
    </>
  );
}
