import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { expenseTypeBadge } from '../../theme/darkModeUi';
import { motion, useReducedMotion } from 'motion/react';
import { CaretRight, CheckSquare, Square, Trash } from '@phosphor-icons/react';
import { CategoryIcon } from '../CategoryIcon';
import { getCategoryById } from '../../data/categories';
import type { Expense } from '../../data/types';

const SELECT_WIDTH = 76;
const DELETE_WIDTH = 76;
const DELETE_SNAP = -DELETE_WIDTH;
const FULL_DELETE_THRESHOLD = 118;
const MAX_LEFT_DRAG = 168;
const SNAP_RATIO = 0.4;
const HORIZONTAL_LOCK_PX = 8;

const SELECT_BRAND = '#3E37FF';
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
  if (value > SELECT_WIDTH) {
    return SELECT_WIDTH + (value - SELECT_WIDTH) * 0.06;
  }
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
  isMultiSelect: boolean;
  isSelected: boolean;
  isRowOpen: boolean;
  onRowOpen: (id: string) => void;
  onRowClose: () => void;
  onSelect: (id: string) => void;
  onSwipeSelect: (id: string) => void;
  onCancelLongPress?: () => void;
  onDeleteGestureStart?: () => void;
  onEdit: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
  formatCurrency: (n: number) => string;
}

export function ExpenseSwipeRow({
  expense,
  isMultiSelect,
  isSelected,
  isRowOpen,
  onRowOpen,
  onRowClose,
  onSelect,
  onSwipeSelect,
  onCancelLongPress,
  onDeleteGestureStart,
  onEdit,
  onRequestDelete,
  formatCurrency,
}: ExpenseSwipeRowProps) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const reduceMotion = useReducedMotion();
  const cat = getCategoryById(expense.categoryId);
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

  useEffect(() => {
    if (isMultiSelect && offsetRef.current > 0) {
      setOffsetSafe(0);
    }
  }, [isMultiSelect, setOffsetSafe]);

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

  const commitSelectFromSwipe = useCallback(() => {
    setOffsetSafe(0);
    onRowClose();
    onSwipeSelect(expense.id);
  }, [expense.id, onRowClose, onSwipeSelect, setOffsetSafe]);

  const settleOffset = useCallback(() => {
    if (isExiting) return;

    const current = offsetRef.current;

    if (current <= -FULL_DELETE_THRESHOLD) {
      runExitDelete();
      return;
    }

    if (current >= SELECT_WIDTH * SNAP_RATIO) {
      commitSelectFromSwipe();
      return;
    }

    if (current > 0) {
      setOffsetSafe(0);
      onRowClose();
      return;
    }

    if (current <= DELETE_SNAP * SNAP_RATIO) {
      setOffsetSafe(DELETE_SNAP);
      onRowOpen(expense.id);
      return;
    }

    setOffsetSafe(0);
    onRowClose();
  }, [commitSelectFromSwipe, expense.id, isExiting, onRowClose, onRowOpen, runExitDelete, setOffsetSafe]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isExiting) return;
    if (isMultiSelect) return;
    if ((e.target as HTMLElement).closest('button[data-swipe-action]')) return;

    horizontalRef.current = false;
    draggingRef.current = true;
    setPressed(true);
    onCancelLongPress?.();
    pointerStart.current = { x: e.clientX, y: e.clientY, offset: offsetRef.current };

    if (offsetRef.current !== 0) onRowOpen(expense.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || isMultiSelect || isExiting) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (!horizontalRef.current) {
      if (Math.abs(dx) < HORIZONTAL_LOCK_PX && Math.abs(dy) < HORIZONTAL_LOCK_PX) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.15) {
        draggingRef.current = false;
        setPressed(false);
        return;
      }
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
    if (isMultiSelect) {
      onSelect(expense.id);
      return;
    }
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
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'stretch',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: SELECT_WIDTH,
            flexShrink: 0,
            backgroundColor: SELECT_BRAND,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: offset > 4 ? 1 : 0,
            transition: isDragging ? 'none' : 'opacity 0.15s ease',
          }}
        >
          <CheckSquare size={22} weight="fill" color="#FFFFFF" />
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: DELETE_WIDTH,
            flexShrink: 0,
            backgroundColor: deleteBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDeleteRevealed ? 1 : 0,
            boxShadow: isDeleteActive ? 'inset 0 0 0 2px rgba(255,255,255,0.35)' : 'none',
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
          cursor: isMultiSelect ? 'pointer' : 'default',
          touchAction: 'pan-y',
          userSelect: 'none',
          outline: isMultiSelect && isSelected ? '2px solid #3E37FF' : 'none',
          outlineOffset: -2,
        }}
      >
        {isMultiSelect && (
          <div style={{ flexShrink: 0 }}>
            {isSelected ? (
              <CheckSquare size={20} weight="fill" color="#3E37FF" />
            ) : (
              <Square size={20} weight="light" color="#D1D5DB" />
            )}
          </div>
        )}

        <CategoryIcon categoryId={expense.categoryId} size="sm" />

        <div style={{ flex: 1, minWidth: 0 }}>
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
          <p style={{ fontSize: 11, color: c.textFaint, margin: '2px 0 0' }}>{cat.name}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p className="font-figure" style={{ fontSize: 15, color: c.text, margin: 0 }}>
              -{formatCurrency(expense.amount)}
            </p>
            {expense.type !== 'one-time' && (() => {
              const badge = expenseTypeBadge(expense.type, c, isDark);
              return (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 2,
                  fontSize: 9,
                  fontWeight: 600,
                  color: badge.color,
                  backgroundColor: badge.bg,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {expense.type === 'monthly' ? 'Monthly' : 'Yearly'}
              </span>
              );
            })()}
          </div>
          <CaretRight size={16} weight="bold" color={c.textFaint} aria-hidden />
        </div>
      </motion.div>

      {offset <= DELETE_SNAP * 0.55 && offset > -FULL_DELETE_THRESHOLD && !isMultiSelect && !isExiting && (
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
