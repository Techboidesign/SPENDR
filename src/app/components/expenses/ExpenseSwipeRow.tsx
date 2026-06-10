import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppColors } from '../../context/AppearanceContext';
import { motion, useReducedMotion } from 'motion/react';
import { CaretRight, Trash } from '@phosphor-icons/react';
import { CategoryIcon } from '../CategoryIcon';
import { isFocusCategoryId } from '../../data/focusCategory';
import type { Expense } from '../../data/types';
import { ExpenseRowMetaBadges } from './ExpenseRowMetaBadges';

function formatExpenseRowAmount(
  expense: Expense,
  formatCurrency: (n: number) => string,
): string {
  if (isFocusCategoryId(expense.categoryId)) {
    if (expense.amount >= 0) return `+${formatCurrency(expense.amount)}`;
    return `-${formatCurrency(Math.abs(expense.amount))}`;
  }
  return `-${formatCurrency(expense.amount)}`;
}

const DELETE_WIDTH = 76;
const DELETE_SNAP = -DELETE_WIDTH;
const FULL_DELETE_THRESHOLD = 118;
const MAX_LEFT_DRAG = 168;
const SNAP_RATIO = 0.4;
const HORIZONTAL_LOCK_PX = 8;

const DELETE_RED = '#EF4444';
const DELETE_DEEP = '#DC2626';

const SNAP_SPRING = { type: 'spring' as const, stiffness: 480, damping: 36, mass: 0.85 };
const EXIT_EASE = [0.32, 0.72, 0, 1] as const;

function applyRubberBand(value: number, min: number, max: number): number {
  if (value > max) return max + (value - max) * 0.18;
  if (value < min) return min + (value - min) * 0.18;
  return value;
}

function clampDragOffset(value: number): number {
  if (value > 0) return 0;
  return applyRubberBand(value, -MAX_LEFT_DRAG, 0);
}

function deletePullProgress(offset: number): number {
  if (offset >= 0) return 0;
  const beyond = -offset - DELETE_WIDTH * 0.35;
  const range = FULL_DELETE_THRESHOLD - DELETE_WIDTH * 0.35;
  return Math.min(1, Math.max(0, beyond / range));
}

export interface ExpenseSwipeRowProps {
  expense: Expense;
  isRowOpen: boolean;
  onRowOpen: (id: string) => void;
  onRowClose: () => void;
  onDeleteGestureStart?: () => void;
  onEdit: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
  formatCurrency: (n: number) => string;
}

export function ExpenseSwipeRow({
  expense,
  isRowOpen,
  onRowOpen,
  onRowClose,
  onDeleteGestureStart,
  onEdit,
  onRequestDelete,
  formatCurrency,
}: ExpenseSwipeRowProps) {
  const c = useAppColors();
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const horizontalRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitHandledRef = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0, offset: 0 });
  const [pressed, setPressed] = useState(false);

  const setOffsetSafe = useCallback((value: number) => {
    const clamped = clampDragOffset(value);
    offsetRef.current = clamped;
    setOffset(clamped);
  }, []);

  useEffect(() => {
    if (!isRowOpen && offsetRef.current !== 0 && !isExiting) {
      setOffsetSafe(0);
    }
  }, [isRowOpen, isExiting, setOffsetSafe]);

  const closeSwipe = useCallback(() => {
    setOffsetSafe(0);
    onRowClose();
  }, [onRowClose, setOffsetSafe]);

  const runExitDelete = useCallback(() => {
    exitHandledRef.current = false;
    onDeleteGestureStart?.();
    setIsExiting(true);
    onRowClose();
  }, [onDeleteGestureStart, onRowClose]);

  const handleExitComplete = useCallback(() => {
    if (!isExiting || exitHandledRef.current) return;
    exitHandledRef.current = true;
    onRequestDelete(expense);
  }, [isExiting, expense, onRequestDelete]);

  const settleOffset = useCallback(() => {
    if (isExiting) return;
    const current = offsetRef.current;

    if (current <= -FULL_DELETE_THRESHOLD) {
      runExitDelete();
      return;
    }
    if (current <= DELETE_SNAP * SNAP_RATIO) {
      setOffsetSafe(DELETE_SNAP);
      onRowOpen(expense.id);
      return;
    }
    setOffsetSafe(0);
    onRowClose();
  }, [expense.id, isExiting, onRowClose, onRowOpen, runExitDelete, setOffsetSafe]);

  // ── pointer handlers ──────────────────────────────────────────────────────
  // Mirror the proven original pattern: draggingRef=true immediately on down,
  // direction detected on first significant move, vertical → cancel drag.
  // This ensures the browser can take over for vertical scroll without us
  // intercepting touch gestures.

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isExiting) return;
    if ((e.target as HTMLElement).closest('button[data-swipe-action]')) return;

    horizontalRef.current = false;
    draggingRef.current = true;
    setPressed(true);
    pointerStart.current = { x: e.clientX, y: e.clientY, offset: offsetRef.current };

    if (offsetRef.current !== 0) onRowOpen(expense.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || isExiting) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (!horizontalRef.current) {
      // Stay undecided while movement is tiny
      if (Math.abs(dx) < HORIZONTAL_LOCK_PX && Math.abs(dy) < HORIZONTAL_LOCK_PX) return;

      // Vertical scroll: cancel drag, let browser handle it
      if (Math.abs(dy) > Math.abs(dx)) {
        draggingRef.current = false;
        setPressed(false);
        return;
      }

      // Right swipe from rest: nothing to do, cancel
      if (dx > 0 && pointerStart.current.offset === 0) {
        draggingRef.current = false;
        setPressed(false);
        return;
      }

      // Confirmed horizontal left-swipe
      horizontalRef.current = true;
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    setOffsetSafe(pointerStart.current.offset + dx);
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (!draggingRef.current && !horizontalRef.current) {
      setPressed(false);
      return;
    }

    draggingRef.current = false;
    horizontalRef.current = false;
    setIsDragging(false);
    setPressed(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }

    if (!isExiting) settleOffset();
  };

  const handleRowClick = () => {
    if (offsetRef.current !== 0) {
      closeSwipe();
      return;
    }
    onEdit(expense);
  };

  const pullProgress = deletePullProgress(offset);
  const displayX = isExiting ? '-108%' : offset;
  const rowOpacity = isExiting ? 0 : 1 - pullProgress * 0.35;
  const isDeleteRevealed = offset < -28;
  const isDeleteActive = isRowOpen && isDeleteRevealed;
  const deleteBg = pullProgress > 0.82 || isDeleteActive ? DELETE_DEEP : DELETE_RED;

  return (
    <div
      data-expense-swipe-row
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: c.surface,
        borderBottom: `1px solid ${c.border}`,
        touchAction: 'pan-y',
      }}
    >
      {/* Delete action background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: DELETE_WIDTH,
            flexShrink: 0,
            backgroundColor: deleteBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDeleteRevealed ? 1 : 0,
            boxShadow: isDeleteActive ? 'inset 0 0 0 1px rgba(255,255,255,0.35)' : 'none',
            transition: isDragging ? 'none' : 'opacity 0.15s ease, background-color 0.12s ease, box-shadow 0.12s ease',
          }}
        >
          <Trash
            size={22}
            weight={isDeleteActive || pullProgress > 0.82 ? 'fill' : 'bold'}
            color="#FFFFFF"
          />
        </div>
      </div>

      {pullProgress > 0.12 && offset < 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 40%, rgba(239, 68, 68, ${0.06 + pullProgress * 0.14}) 100%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={ev => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            handleRowClick();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        initial={false}
        animate={{
          x: displayX,
          opacity: rowOpacity,
          backgroundColor: pressed ? c.surfaceMuted : c.surface,
        }}
        transition={
          isExiting
            ? { duration: reduceMotion ? 0.15 : 0.34, ease: EXIT_EASE }
            : isDragging || reduceMotion
              ? { duration: 0 }
              : SNAP_SPRING
        }
        onAnimationComplete={() => {
          if (isExiting) handleExitComplete();
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'default',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <CategoryIcon categoryId={expense.categoryId} size="sm" />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ExpenseRowMetaBadges categoryId={expense.categoryId} expenseType={expense.type} />
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: c.text,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {expense.name}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <p className="font-figure" style={{ fontSize: 15, color: c.text, margin: 0 }}>
            {formatExpenseRowAmount(expense, formatCurrency)}
          </p>
          <CaretRight size={16} weight="bold" color={c.textFaint} aria-hidden />
        </div>
      </motion.div>

      {offset <= DELETE_SNAP * 0.55 && offset > -FULL_DELETE_THRESHOLD && !isExiting && (
        <button
          type="button"
          data-swipe-action="delete"
          onClick={e => {
            e.stopPropagation();
            runExitDelete();
          }}
          aria-label="Delete expense"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: DELETE_WIDTH,
            zIndex: 2,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  );
}
