import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FloppyDisk } from '@phosphor-icons/react';
import { useAppColors, useAppearance } from '../context/AppearanceContext';
import {
  EASE_OUT_SINE,
  SAVE_HINT_EASE_IN,
  SAVE_HINT_ENTER_S,
  SAVE_HINT_EXIT_S,
  SAVE_HINT_VISIBLE_MS,
} from '../theme/motion';

export const MODAL_ACTION_BAR_HEIGHT = 76;

type LeftVariant = 'cancel' | 'delete';

export function ModalActionBar({
  onSave,
  onPrimary,
  onLeft,
  onSecondary,
  leftLabel,
  secondaryLabel,
  leftVariant = 'cancel',
  saveLabel,
  primaryLabel,
  saveDisabled = false,
  primaryDisabled,
  /** Shown when the user taps save while it is disabled */
  saveDisabledHint,
  /** Force dark chrome (e.g. avatar crop). Defaults to app appearance. */
  dark,
}: {
  onSave?: () => void;
  onPrimary?: () => void;
  onLeft?: () => void;
  onSecondary?: () => void;
  leftLabel?: string;
  secondaryLabel?: string;
  leftVariant?: LeftVariant;
  saveLabel?: string;
  primaryLabel?: string;
  saveDisabled?: boolean;
  primaryDisabled?: boolean;
  saveDisabledHint?: string;
  dark?: boolean;
}) {
  const handleSave = onSave ?? onPrimary;
  const handleLeft = onLeft ?? onSecondary;
  const resolvedLeftLabel = leftLabel ?? secondaryLabel ?? 'CANCEL';
  const resolvedSaveLabel = saveLabel ?? primaryLabel ?? 'SAVE';
  const resolvedSaveDisabled = saveDisabled || Boolean(primaryDisabled);
  const [saveHintVisible, setSaveHintVisible] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveHintHoverRef = useRef(false);
  const saveHintTapPinRef = useRef(false);

  const syncSaveHint = () => {
    const show =
      resolvedSaveDisabled &&
      Boolean(saveDisabledHint) &&
      (saveHintHoverRef.current || saveHintTapPinRef.current);
    setSaveHintVisible(show);
  };

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!resolvedSaveDisabled) {
      saveHintHoverRef.current = false;
      saveHintTapPinRef.current = false;
      setSaveHintVisible(false);
    }
  }, [resolvedSaveDisabled]);

  const showSaveHintOnTap = () => {
    if (!resolvedSaveDisabled || !saveDisabledHint) return;
    saveHintTapPinRef.current = true;
    syncSaveHint();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      saveHintTapPinRef.current = false;
      syncSaveHint();
    }, SAVE_HINT_VISIBLE_MS);
  };

  const onSaveHintEnter = () => {
    if (!resolvedSaveDisabled || !saveDisabledHint) return;
    saveHintHoverRef.current = true;
    syncSaveHint();
  };

  const onSaveHintLeave = () => {
    saveHintHoverRef.current = false;
    syncSaveHint();
  };

  if (!handleSave || !handleLeft) return null;
  const c = useAppColors();
  const { isDark: appDark } = useAppearance();
  const isDark = dark ?? appDark;
  const reduceMotion = useReducedMotion();
  const hintBg = isDark ? '#1E1E2A' : '#1A1A2E';

  const leftBg =
    leftVariant === 'delete'
      ? isDark
        ? '#3A1C1C'
        : '#FEE2E2'
      : isDark
        ? c.inputBg
        : '#FFFFFF';
  const leftColor = leftVariant === 'delete' ? c.danger : isDark ? c.textSecondary : '#6B7280';
  const leftBorder =
    leftVariant === 'delete' ? 'none' : `1px solid ${isDark ? c.inputBorder : '#E5E7EB'}`;

  const saveBg = resolvedSaveDisabled ? (isDark ? '#3D3A6E' : '#C7C5FF') : c.accent;

  const actionButtonStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '14px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.6,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
  };

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 20px',
        backgroundColor: c.modalSheet,
        borderTop: `1px solid ${isDark ? c.border : '#F3F4F6'}`,
        boxShadow: isDark ? c.shadow : '0 -8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          width: '100%',
          alignItems: 'stretch',
        }}
      >
        <button
          type="button"
          onClick={handleLeft}
          style={{
            ...actionButtonStyle,
            border: leftBorder,
            backgroundColor: leftBg,
            color: leftColor,
            cursor: 'pointer',
          }}
        >
          {resolvedLeftLabel}
        </button>

        <div
          style={{ position: 'relative', minWidth: 0, width: '100%' }}
          onMouseEnter={onSaveHintEnter}
          onMouseLeave={onSaveHintLeave}
        >
          <AnimatePresence>
            {saveHintVisible && saveDisabledHint ? (
              <motion.div
                key="save-disabled-hint"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { duration: SAVE_HINT_ENTER_S, ease: EASE_OUT_SINE },
                }}
                exit={{
                  opacity: 0,
                  y: 6,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { duration: SAVE_HINT_EXIT_S, ease: SAVE_HINT_EASE_IN },
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 'calc(100% + 8px)',
                  zIndex: 20,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: hintBg,
                  color: '#F8FAFC',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                  pointerEvents: 'none',
                  whiteSpace: 'normal',
                }}
              >
                {saveDisabledHint}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -5,
                    width: 10,
                    height: 10,
                    transform: 'translateX(-50%) rotate(45deg)',
                    backgroundColor: hintBg,
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            type="button"
            aria-disabled={resolvedSaveDisabled}
            onClick={() => {
              if (resolvedSaveDisabled) {
                showSaveHintOnTap();
                return;
              }
              handleSave();
            }}
            style={{
              ...actionButtonStyle,
              border: 'none',
              backgroundColor: saveBg,
              color: c.onAccent,
              cursor: resolvedSaveDisabled ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FloppyDisk size={18} weight="bold" />
            {resolvedSaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
