import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getPrimaryGoalBarColor } from '../../utils/primaryGoalProgress';

const BAR_EASE = [0.32, 0.72, 0, 1] as const;
/** Thumb center inset — aligns 0% with icon / % row at track start */
const THUMB_INSET_PX = 12;
const THUMB_SIZE = 20;
/** Drag hint: large accent ripples behind thumb (fades to transparent) */
const PULSE_SCALE_END = 3.6;
const PULSE_OPACITY_START = 0.78;
const PULSE_DURATION_S = 0.85;
const PULSE_STAGGER_S = 0.5;
/** Halo box so scaled ripples are not clipped by the thumb wrapper */
const PULSE_HALO_SIZE = 72;

const TRACK_STRIPE = (accentColor: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 5px, ${accentColor}1A 5px, ${accentColor}1A 7px)`;

function amountFromPointer(clientX: number, track: HTMLDivElement, targetAmount: number): number {
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0 || targetAmount <= 0) return 0;
  const usable = Math.max(0, rect.width - THUMB_INSET_PX * 2);
  const x = clientX - rect.left - THUMB_INSET_PX;
  const ratio = usable > 0 ? Math.max(0, Math.min(1, x / usable)) : 0;
  return Math.round(ratio * targetAmount);
}

export function GoalTargetProgressSlider({
  currentAmount,
  targetAmount,
  accentColor,
  trackBg,
  fillColor,
  animationDelay = 0,
  onPreview,
  onCommit,
}: {
  currentAmount: number;
  targetAmount: number;
  accentColor: string;
  trackBg: string;
  fillColor: string;
  animationDelay?: number;
  onPreview?: (amount: number | null) => void;
  onCommit: (amount: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [showDragHint, setShowDragHint] = useState(true);

  const displayAmount = previewAmount ?? currentAmount;
  const displayPct =
    targetAmount > 0 ? Math.round(Math.max(0, Math.min(100, (displayAmount / targetAmount) * 100))) : 0;
  const barColor = getPrimaryGoalBarColor(displayPct, true);

  useEffect(() => {
    if (isDragging) return;
    setAnimatedPct(0);
    const t = window.setTimeout(() => setAnimatedPct(displayPct), animationDelay + 40);
    return () => window.clearTimeout(t);
  }, [displayPct, animationDelay, isDragging]);

  useEffect(() => {
    if (reduceMotion) {
      setShowDragHint(false);
      return;
    }
    const hintStartMs = animationDelay + 880;
    const hintDurationMs = (PULSE_DURATION_S * 2 + PULSE_STAGGER_S) * 1000 + 80;
    const t = window.setTimeout(() => setShowDragHint(false), hintStartMs + hintDurationMs);
    return () => window.clearTimeout(t);
  }, [animationDelay, reduceMotion]);

  useEffect(() => {
    if (isDragging) setShowDragHint(false);
  }, [isDragging]);

  const fillWidth = isDragging ? displayPct : animatedPct;
  const thumbColor = fillWidth > 0 ? barColor : fillColor;
  const hintBaseDelay = (animationDelay + 880) / 1000;

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = amountFromPointer(clientX, track, targetAmount);
      setPreviewAmount(next);
      onPreview?.(next);
    },
    [onPreview, targetAmount],
  );

  const endDrag = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = amountFromPointer(clientX, track, targetAmount);
      setPreviewAmount(null);
      setIsDragging(false);
      onCommit(next);
    },
    [onCommit, targetAmount],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromPointer(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    updateFromPointer(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    endDrag(e.clientX);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setPreviewAmount(null);
    setIsDragging(false);
    onPreview?.(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (targetAmount <= 0) return;
    const step = e.shiftKey ? Math.max(1, Math.round(targetAmount / 20)) : 1;
    let next = displayAmount;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(targetAmount, displayAmount + step);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, displayAmount - step);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = targetAmount;
    else return;
    e.preventDefault();
    e.stopPropagation();
    onCommit(next);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={targetAmount}
      aria-valuenow={displayAmount}
      aria-label="Amount saved toward goal"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'relative',
        height: 28,
        display: 'flex',
        alignItems: 'center',
        touchAction: 'none',
        cursor: 'pointer',
        outline: 'none',
        overflow: 'visible',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: trackBg,
          backgroundImage: TRACK_STRIPE(accentColor),
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${fillWidth}%` }}
          transition={isDragging ? { duration: 0 } : { duration: 0.85, ease: BAR_EASE }}
          style={{
            height: '100%',
            backgroundColor: fillWidth > 0 ? barColor : fillColor,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: `clamp(${THUMB_INSET_PX}px, ${fillWidth}%, calc(100% - ${THUMB_INSET_PX}px))`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: PULSE_HALO_SIZE,
          height: PULSE_HALO_SIZE,
          pointerEvents: 'none',
          zIndex: 2,
          overflow: 'visible',
        }}
      >
        {showDragHint && !reduceMotion ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              marginLeft: -THUMB_SIZE / 2,
              marginTop: -THUMB_SIZE / 2,
            }}
          >
            <motion.div
              initial={{ scale: 1, opacity: PULSE_OPACITY_START }}
              animate={{ scale: PULSE_SCALE_END, opacity: 0 }}
              transition={{
                duration: PULSE_DURATION_S,
                delay: hintBaseDelay,
                ease: [0.16, 0.84, 0.24, 1],
              }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: accentColor,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            />
            <motion.div
              initial={{ scale: 1, opacity: PULSE_OPACITY_START }}
              animate={{ scale: PULSE_SCALE_END, opacity: 0 }}
              transition={{
                duration: PULSE_DURATION_S,
                delay: hintBaseDelay + PULSE_STAGGER_S,
                ease: [0.16, 0.84, 0.24, 1],
              }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: accentColor,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            marginLeft: -THUMB_SIZE / 2,
            marginTop: -THUMB_SIZE / 2,
            borderRadius: '50%',
            backgroundColor: thumbColor,
            border: '1px solid #FFFFFF',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}
