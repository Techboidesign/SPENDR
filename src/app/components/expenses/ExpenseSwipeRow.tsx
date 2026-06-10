import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppearance, useAppColors } from '../../context/AppearanceContext';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';
import { CaretRight, Trash } from '@phosphor-icons/react';
import { CategoryIcon } from '../CategoryIcon';
import {
  EXPENSE_SELECT_BRAND,
  EXPENSE_SELECT_CHECKBOX_SIZE,
  ExpenseRowSelectCheckbox,
  expenseRowSelectedBackground,
} from './ExpenseRowSelectCheckbox';
import { isFocusCategoryId } from '../../data/focusCategory';
import type { Expense } from '../../data/types';
import {
  EXPENSE_MULTISELECT_STAGGER,
  EXPENSE_SWIPE_DELETE_EXIT,
  EXPENSE_SWIPE_SETTLE,
  EXPENSE_SWIPE_SETTLE_REDUCED,
} from '../../theme/motion';
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

const SELECT_WIDTH = 76;
const DELETE_WIDTH = 76;
const DELETE_SNAP = -DELETE_WIDTH;
const FULL_DELETE_THRESHOLD = 118;
const MAX_LEFT_DRAG = 168;
const SNAP_RATIO = 0.4;
const HORIZONTAL_LOCK_PX = 8;

const SELECT_BRAND_RGB = '62, 55, 255';
const DELETE_RED_RGB = '252, 165, 165';
const DELETE_LABEL = '#FDA4AF';
const DELETE_LABEL_ACTIVE = '#F87171';
const SWIPE_GRADIENT_FADE = 42;
const SWIPE_GRADIENT_INNER = 28;
const SWIPE_GRADIENT_OUTER = 72;

function applyRubberBand(value: number, min: number, max: number): number {
  if (value > max) return max + (value - max) * 0.18;
  if (value < min) return min + (value - min) * 0.18;
  return value;
}

function clampDragOffset(value: number): number {
  if (value > 0) {
    if (value <= SELECT_WIDTH) return value;
    const excess = value - SELECT_WIDTH;
    return SELECT_WIDTH + excess * 0.12;
  }
  return applyRubberBand(value, -MAX_LEFT_DRAG, 0);
}

function deletePullProgress(offset: number): number {
  if (offset >= 0) return 0;
  const beyond = -offset - DELETE_WIDTH * 0.35;
  const range = FULL_DELETE_THRESHOLD - DELETE_WIDTH * 0.35;
  return Math.min(1, Math.max(0, beyond / range));
}

function deleteRevealProgress(offset: number): number {
  if (offset >= 0) return 0;
  return Math.min(1, -offset / DELETE_WIDTH);
}

function selectRevealProgress(offset: number): number {
  if (offset <= 0) return 0;
  return Math.min(1, offset / SELECT_WIDTH);
}

function settleTransition(reduceMotion: boolean | null) {
  return reduceMotion ? EXPENSE_SWIPE_SETTLE_REDUCED : EXPENSE_SWIPE_SETTLE;
}

/** Mirrored full-row wash — delete reveals from the right, select from the left. */
function deleteRevealGradient(
  offset: number,
  deleteReveal: number,
  pullProgress: number,
): string {
  const fadeStop = Math.max(0, 100 + (offset / MAX_LEFT_DRAG) * SWIPE_GRADIENT_FADE);
  const midAlpha = 0.035 + deleteReveal * 0.08 + pullProgress * 0.05;
  const edgeAlpha = 0.06 + deleteReveal * 0.11 + pullProgress * 0.07;
  return `linear-gradient(90deg, transparent ${fadeStop}%, rgba(${DELETE_RED_RGB}, ${midAlpha}) ${SWIPE_GRADIENT_OUTER}%, rgba(${DELETE_RED_RGB}, ${edgeAlpha}) 100%)`;
}

function selectRevealGradient(offset: number, selectReveal: number): string {
  const fadeStop = Math.max(0, Math.min(100, 100 - (offset / MAX_LEFT_DRAG) * SWIPE_GRADIENT_FADE));
  const edgeAlpha = 0.025 + selectReveal * 0.06;
  const midAlpha = 0.04 + selectReveal * 0.08;
  return `linear-gradient(90deg, rgba(${SELECT_BRAND_RGB}, ${edgeAlpha}) 0%, rgba(${SELECT_BRAND_RGB}, ${midAlpha}) ${SWIPE_GRADIENT_INNER}%, transparent ${fadeStop}%)`;
}

export interface ExpenseSwipeRowProps {
  expense: Expense;
  listIndex: number;
  multiSelectEpoch: number;
  isHighlighted?: boolean;
  isMultiSelect: boolean;
  isSelected: boolean;
  isRowOpen: boolean;
  onRowOpen: (id: string) => void;
  onRowClose: () => void;
  onSelect: (id: string) => void;
  onSwipeSelect: (id: string) => void;
  onDeleteGestureStart?: () => void;
  onEdit: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
  formatCurrency: (n: number) => string;
}

export function ExpenseSwipeRow({
  expense,
  listIndex,
  multiSelectEpoch,
  isHighlighted = false,
  isMultiSelect,
  isSelected,
  isRowOpen,
  onRowOpen,
  onRowClose,
  onSelect,
  onSwipeSelect,
  onDeleteGestureStart,
  onEdit,
  onRequestDelete,
  formatCurrency,
}: ExpenseSwipeRowProps) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const horizontalRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitHandledRef = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0, offset: 0 });
  const suppressClickRef = useRef(false);
  const settlingRef = useRef(false);
  const panelRafRef = useRef<number | null>(null);

  const syncPanelOffset = useCallback((value: number) => {
    offsetRef.current = value;
    if (panelRafRef.current !== null) return;
    panelRafRef.current = requestAnimationFrame(() => {
      panelRafRef.current = null;
      setOffset(offsetRef.current);
    });
  }, []);

  useMotionValueEvent(x, 'change', latest => {
    syncPanelOffset(latest);
  });

  const animateX = useCallback(
    async (target: number) => {
      offsetRef.current = target;
      await animate(x, target, settleTransition(reduceMotion));
      setOffset(target);
    },
    [reduceMotion, x],
  );

  useEffect(() => {
    if (settlingRef.current || draggingRef.current || isExiting) return;
    if (!isRowOpen && offsetRef.current !== 0) {
      void animateX(0);
    }
  }, [animateX, isExiting, isRowOpen, x]);

  useEffect(() => {
    if (isMultiSelect && offsetRef.current > 0) {
      x.set(0);
      setOffset(0);
      offsetRef.current = 0;
    }
  }, [isMultiSelect, x]);

  const closeSwipe = useCallback(() => {
    void animateX(0);
    onRowClose();
  }, [animateX, onRowClose]);

  const runExitDelete = useCallback(() => {
    exitHandledRef.current = false;
    onDeleteGestureStart?.();
    onRowClose();
    setIsExiting(true);
    void animate(
      x,
      '-108%',
      reduceMotion
        ? { duration: 0.12, ease: EXPENSE_SWIPE_DELETE_EXIT.ease }
        : EXPENSE_SWIPE_DELETE_EXIT,
    ).then(() => {
      if (!exitHandledRef.current) {
        exitHandledRef.current = true;
        onRequestDelete(expense);
      }
    });
  }, [expense, onDeleteGestureStart, onRequestDelete, onRowClose, reduceMotion, x]);

  const commitSelectFromSwipe = useCallback(() => {
    void animateX(0).then(() => {
      onRowClose();
      onSwipeSelect(expense.id);
    });
  }, [animateX, expense.id, onRowClose, onSwipeSelect]);

  const settleOffset = useCallback(() => {
    if (isExiting) return;

    settlingRef.current = true;
    const current = offsetRef.current;

    if (current <= -FULL_DELETE_THRESHOLD) {
      settlingRef.current = false;
      runExitDelete();
      return;
    }

    if (current >= SELECT_WIDTH * SNAP_RATIO) {
      settlingRef.current = false;
      commitSelectFromSwipe();
      return;
    }

    if (current > 0) {
      void animateX(0).then(() => {
        onRowClose();
        settlingRef.current = false;
      });
      return;
    }

    if (current <= DELETE_SNAP * SNAP_RATIO) {
      void animateX(DELETE_SNAP).then(() => {
        onRowOpen(expense.id);
        settlingRef.current = false;
      });
      return;
    }

    void animateX(0).then(() => {
      onRowClose();
      settlingRef.current = false;
    });
  }, [
    animateX,
    commitSelectFromSwipe,
    expense.id,
    isExiting,
    onRowClose,
    onRowOpen,
    runExitDelete,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isExiting) return;
    if (isMultiSelect) return;
    if ((e.target as HTMLElement).closest('button[data-swipe-action]')) return;

    suppressClickRef.current = false;
    horizontalRef.current = false;
    draggingRef.current = true;
    pointerStart.current = { x: e.clientX, y: e.clientY, offset: offsetRef.current };

    if (offsetRef.current !== 0) onRowOpen(expense.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || isMultiSelect || isExiting) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (!horizontalRef.current) {
      if (Math.abs(dx) < HORIZONTAL_LOCK_PX && Math.abs(dy) < HORIZONTAL_LOCK_PX) return;

      if (Math.abs(dy) > Math.abs(dx)) {
        draggingRef.current = false;
        return;
      }

      horizontalRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    x.set(clampDragOffset(pointerStart.current.offset + dx));
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    const wasHorizontal = horizontalRef.current;

    if (!draggingRef.current && !wasHorizontal) return;

    draggingRef.current = false;
    horizontalRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }

    if (wasHorizontal) {
      suppressClickRef.current = true;
      if (!isExiting) settleOffset();
    }
  };

  const handleRowClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

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
  const deleteReveal = deleteRevealProgress(offset);
  const selectReveal = selectRevealProgress(offset);
  const isDeleteActive = isRowOpen && offset <= DELETE_SNAP * 0.55;
  const deleteLabelOpacity = Math.min(1, deleteReveal * 1.15);
  const deleteTint =
    isDeleteActive || pullProgress > 0.82 ? DELETE_LABEL_ACTIVE : DELETE_LABEL;
  const selectAffordanceMotion = {
    opacity: selectReveal,
    transform: `scale(${0.88 + selectReveal * 0.12}) translateX(${(1 - selectReveal) * -8}px)`,
  };
  const rowDim = offset < 0 ? 1 - deleteReveal * 0.22 - pullProgress * 0.12 : 1;
  const rowBottomBorder =
    isMultiSelect && isSelected ? EXPENSE_SELECT_BRAND : c.border;
  const rowBackground =
    (isMultiSelect && isSelected) || isHighlighted
      ? expenseRowSelectedBackground(c.surface, isDark)
      : c.surface;
  const rowEdgeMask =
    offset < -4
      ? `linear-gradient(90deg, #000 0%, #000 ${Math.max(55, 100 + (offset / MAX_LEFT_DRAG) * 28)}%, transparent 100%)`
      : offset > 4
        ? `linear-gradient(90deg, transparent 0%, #000 ${Math.min(16, 6 + selectReveal * 10)}%, #000 100%)`
        : undefined;

  return (
    <div
      data-expense-swipe-row
      data-expense-id={expense.id}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: c.surface,
        borderBottom: `1px solid ${rowBottomBorder}`,
        touchAction: 'pan-y',
      }}
    >
      {/* Select — full-row wash mirrored from delete, softer purple */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: selectRevealGradient(offset, selectReveal),
          opacity: selectReveal > 0.02 ? 1 : 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 16,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          width: EXPENSE_SELECT_CHECKBOX_SIZE,
          ...selectAffordanceMotion,
        }}
      >
        <ExpenseRowSelectCheckbox checked />
      </div>

      {/* Delete — lighter red wash + trash + label */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: deleteRevealGradient(offset, deleteReveal, pullProgress),
          opacity: deleteReveal > 0.02 ? 1 : 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 16,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
          gap: 5,
          opacity: deleteLabelOpacity,
          transform: `translateX(${(1 - deleteLabelOpacity) * 10}px)`,
        }}
      >
        <Trash size={16} weight="bold" color={deleteTint} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: deleteTint,
          }}
        >
          Delete
        </span>
      </div>

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
        style={{
          x,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: rowBackground,
          cursor: isMultiSelect ? 'pointer' : 'default',
          touchAction: 'pan-y',
          userSelect: 'none',
          willChange: 'transform',
          opacity: isExiting ? 0 : rowDim,
          transition: isExiting ? 'opacity 0.2s ease-out' : undefined,
          WebkitMaskImage: rowEdgeMask,
          maskImage: rowEdgeMask,
        }}
      >
        {isMultiSelect && (
          <motion.div
            key={`ms-${multiSelectEpoch}`}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, scale: 0.88, x: -8 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: EXPENSE_MULTISELECT_STAGGER.duration,
              ease: EXPENSE_MULTISELECT_STAGGER.ease,
              delay: listIndex * EXPENSE_MULTISELECT_STAGGER.step,
            }}
            style={{ flexShrink: 0 }}
          >
            <ExpenseRowSelectCheckbox checked={isSelected} />
          </motion.div>
        )}

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

      {offset <= DELETE_SNAP * 0.55 &&
        offset > -FULL_DELETE_THRESHOLD &&
        !isMultiSelect &&
        !isExiting && (
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
              width: DELETE_WIDTH + 24,
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
