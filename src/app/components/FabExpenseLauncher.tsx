import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Plus, UploadSimple, X } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { useAppMotion } from '../hooks/useAppMotion';
import {
  FAB_COLOR_TRANSITION,
  FAB_ELEVATION_SHADOW,
  FAB_ICON_SWAP_TRANSITION,
  FAB_MENU_AUTO_CLOSE_MS,
  FAB_SATELLITE_SHADOW,
  FAB_SATELLITE_SHADOW_HOVER,
} from '../theme/motion';

export const FAB_SIZE = 68;
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

export function FabExpenseLauncher() {
  const { openAddModal, showAddModal, scanReceiptFromCamera, uploadReceiptDocuments, isParsingReceipt } =
    useApp();
  const c = useAppColors();
  const { reduceMotion, fabPopTransition, popScale } = useAppMotion();
  const brand = c.fab;
  const brandActive = c.accent;

  const [open, setOpen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pointerInMenuRef = useRef(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearAutoClose();
    setOpen(false);
    setPressing(false);
  }, [clearAutoClose]);

  /** Close after 3s with no pointer over hub or satellites. */
  const scheduleAutoClose = useCallback(() => {
    clearAutoClose();
    autoCloseRef.current = setTimeout(() => {
      setOpen(false);
      autoCloseRef.current = null;
    }, FAB_MENU_AUTO_CLOSE_MS);
  }, [clearAutoClose]);

  const syncInactivityTimer = useCallback(() => {
    if (!open) return;
    if (pointerInMenuRef.current) {
      clearAutoClose();
      return;
    }
    scheduleAutoClose();
  }, [open, clearAutoClose, scheduleAutoClose]);

  const handleMenuPointerEnter = useCallback(() => {
    pointerInMenuRef.current = true;
    clearAutoClose();
  }, [clearAutoClose]);

  const handleMenuPointerLeave = useCallback(() => {
    pointerInMenuRef.current = false;
    syncInactivityTimer();
  }, [syncInactivityTimer]);

  const openMenu = useCallback(() => {
    setOpen(true);
  }, []);

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }, [open, closeMenu, openMenu]);

  useEffect(() => {
    if (showAddModal) closeMenu();
  }, [showAddModal, closeMenu]);

  useEffect(() => () => clearAutoClose(), [clearAutoClose]);

  useEffect(() => {
    if (!open) {
      clearAutoClose();
      return;
    }
    syncInactivityTimer();
  }, [open, clearAutoClose, syncInactivityTimer]);

  const runSlot = useCallback(
    (slot: FabSlot) => {
      clearAutoClose();

      if (slot === 'edit') {
        closeMenu();
        openAddModal();
        return;
      }

      if (slot === 'camera') {
        // Synchronous click — required for file/camera picker (iOS/Safari).
        cameraRef.current?.click();
        closeMenu();
        return;
      }

      uploadRef.current?.click();
      closeMenu();
    },
    [clearAutoClose, closeMenu, openAddModal],
  );

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
        ref={menuRef}
        onPointerEnter={handleMenuPointerEnter}
        onPointerLeave={handleMenuPointerLeave}
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
                    scale: 1,
                    x: slot.offsetX,
                    y: slot.offsetY,
                    opacity: 1,
                    backgroundColor: brand,
                    boxShadow: FAB_SATELLITE_SHADOW,
                  }}
                  whileHover={
                    reduceMotion || isParsingReceipt
                      ? undefined
                      : {
                          scale: 1.08,
                          backgroundColor: brandActive,
                          boxShadow: FAB_SATELLITE_SHADOW_HOVER,
                        }
                  }
                  whileTap={
                    reduceMotion || isParsingReceipt ? undefined : { scale: 0.96 }
                  }
                  exit={{
                    scale: POP_SCALE_FROM,
                    x: 0,
                    y: 0,
                    opacity: 0,
                  }}
                  transition={{
                    ...fabPopTransition,
                    delay: reduceMotion ? 0 : i * 0.015,
                    backgroundColor: FAB_COLOR_TRANSITION,
                    boxShadow: FAB_COLOR_TRANSITION,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    if (isParsingReceipt) return;
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
                    border: 'none',
                    cursor: isParsingReceipt ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    padding: 0,
                  }}
                >
                  <slot.Icon size={slot.iconSize} weight="bold" color="#FFFFFF" />
                </motion.button>
              );
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={e => {
            e.stopPropagation();
            if (isParsingReceipt) return;
            toggleMenu();
          }}
          onPointerDown={() => setPressing(true)}
          onPointerUp={() => setPressing(false)}
          onPointerCancel={() => setPressing(false)}
          aria-label={open ? 'Close expense menu' : 'Add expense'}
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={isParsingReceipt}
          animate={{
            scale: pressing ? 0.92 : 1,
            backgroundColor: open ? c.surface : brand,
            boxShadow: open
              ? '0 4px 16px rgba(0, 0, 0, 0.12)'
              : FAB_ELEVATION_SHADOW,
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
            border: 'none',
            cursor: isParsingReceipt ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            padding: 0,
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
                  <X size={28} weight="bold" color={c.text} />
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
      </div>
    </>
  );
}
