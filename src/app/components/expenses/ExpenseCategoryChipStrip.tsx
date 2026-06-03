import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Expense } from '../../data/types';
import { isSpendingExpense } from '../../data/focusCategory';
import { CHIP_STRIP_SCROLL_MS } from '../../theme/motion';
import { animateScrollLeft, scrollOffsetToRevealChip } from '../../utils/animateScrollLeft';
import { CategorySelectPill } from '../shared/CategorySelectPill';
import { useAppColors } from '../../context/AppearanceContext';

export type CategoryChipScrollTarget = {
  categoryId: string;
  /** Increment to replay scroll when a new auto-suggestion lands on the same id. */
  token: number;
};

export type CategoryChipOption = {
  id: string;
  name: string;
  bg: string;
  color: string;
  iconColor?: string;
};

const RECENT_LIMIT = 8;
const FADE_WIDTH_PX = 28;
/** Matches AppBottomSheetLayout body horizontal padding */
const STRIP_CONTENT_INSET_PX = 20;

export function getRecentCategoryIds(expenses: Expense[], limit = RECENT_LIMIT): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const sorted = [...expenses]
    .filter(isSpendingExpense)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  for (const expense of sorted) {
    if (seen.has(expense.categoryId)) continue;
    seen.add(expense.categoryId);
    ids.push(expense.categoryId);
    if (ids.length >= limit) break;
  }
  return ids;
}

/** Recent first (stable recency order), then the rest in catalog order. */
export function orderCategoriesForChipStrip(
  categories: CategoryChipOption[],
  recentIds: string[],
  options?: {
    /** When true (name auto-suggest), selected chip is moved to the front. */
    pinSelectedFirst?: boolean;
    selectedId?: string;
    /** Manual pick: freeze visual order so chips do not jump in the strip. */
    orderLockIds?: readonly string[] | null;
  },
): CategoryChipOption[] {
  const byId = new Map(categories.map(c => [c.id, c]));

  if (options?.orderLockIds?.length) {
    const ordered: CategoryChipOption[] = [];
    const seen = new Set<string>();
    for (const id of options.orderLockIds) {
      const cat = byId.get(id);
      if (!cat || seen.has(id)) continue;
      ordered.push(cat);
      seen.add(id);
    }
    for (const cat of categories) {
      if (!seen.has(cat.id)) ordered.push(cat);
    }
    return ordered;
  }

  const ordered: CategoryChipOption[] = [];
  const seen = new Set<string>();

  const push = (id: string) => {
    if (seen.has(id)) return;
    const cat = byId.get(id);
    if (!cat) return;
    ordered.push(cat);
    seen.add(id);
  };

  for (const id of recentIds) push(id);
  for (const cat of categories) push(cat.id);

  const selectedId = options?.selectedId?.trim();
  if (options?.pinSelectedFirst && selectedId) {
    const selected = byId.get(selectedId);
    if (selected) {
      return [selected, ...ordered.filter(c => c.id !== selectedId)];
    }
  }

  return ordered;
}

export function ExpenseCategoryChipStrip({
  categories,
  selectedId,
  onSelect,
  recentIds,
  heading = 'CATEGORY',
  headingColor,
  invalid = false,
  errorId,
  scrollToCategory,
  pinSelectedFirst = false,
  orderLockIds = null,
}: {
  categories: CategoryChipOption[];
  /** Empty string = no category selected yet */
  selectedId: string;
  onSelect: (categoryId: string) => void;
  recentIds: string[];
  heading?: string;
  headingColor?: string;
  invalid?: boolean;
  errorId?: string;
  /** Auto-suggestion: ease-out-sine scroll to the selected chip */
  scrollToCategory?: CategoryChipScrollTarget | null;
  /** Name auto-suggest: show selected chip first; manual tap keeps catalog order */
  pinSelectedFirst?: boolean;
  /** Frozen chip order after manual select (prevents jump when auto-order ends). */
  orderLockIds?: readonly string[] | null;
}) {
  const activeId = selectedId || null;
  const c = useAppColors();
  const reduceMotion = useReducedMotion();
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLDivElement>());

  const autoScrollActive = Boolean(scrollToCategory?.token);

  const ordered = useMemo(
    () =>
      orderCategoriesForChipStrip(categories, recentIds, {
        pinSelectedFirst: pinSelectedFirst && !orderLockIds?.length,
        selectedId: selectedId || undefined,
        orderLockIds,
      }),
    [categories, recentIds, pinSelectedFirst, selectedId, orderLockIds],
  );

  useLayoutEffect(() => {
    const target = scrollToCategory;
    if (!target?.categoryId || !target.token) return;

    const run = () => {
      const container = stripRef.current;
      const chip = chipRefs.current.get(target.categoryId);
      if (!container || !chip) return;

      const offset = scrollOffsetToRevealChip(container, chip, {
        align: pinSelectedFirst ? 'nearest' : 'center',
        padding: STRIP_CONTENT_INSET_PX,
      });
      animateScrollLeft(container, offset, {
        durationMs: CHIP_STRIP_SCROLL_MS,
        reducedMotion: reduceMotion ?? false,
      });
    };

    requestAnimationFrame(run);
  }, [
    scrollToCategory?.categoryId,
    scrollToCategory?.token,
    ordered,
    reduceMotion,
    pinSelectedFirst,
  ]);

  const fadeEdge = (side: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    top: 0,
    bottom: 4,
    width: FADE_WIDTH_PX,
    pointerEvents: 'none',
    zIndex: 1,
    ...(side === 'left' ? { left: 0 } : { right: 0 }),
    background:
      side === 'left'
        ? `linear-gradient(to right, ${c.modalSheet} 0%, ${c.modalSheet} 25%, transparent 100%)`
        : `linear-gradient(to left, ${c.modalSheet} 0%, ${c.modalSheet} 25%, transparent 100%)`,
  });

  return (
    <div>
      <p
        id={errorId ? `${errorId}-label` : undefined}
        style={{
          margin: '0 0 8px',
          fontSize: 11,
          fontWeight: 600,
          color: headingColor ?? (invalid ? c.danger : c.textMuted),
          letterSpacing: 0.4,
        }}
      >
        {heading}
      </p>
      <div
        style={{
          position: 'relative',
          marginLeft: -STRIP_CONTENT_INSET_PX,
          marginRight: -STRIP_CONTENT_INSET_PX,
        }}
      >
        <div
          ref={stripRef}
          className="expense-category-chip-strip"
          role="listbox"
          aria-label={heading}
          aria-invalid={invalid}
          aria-labelledby={errorId ? `${errorId}-label` : undefined}
          aria-describedby={invalid && errorId ? errorId : undefined}
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: invalid ? '8px 0 4px' : '0 0 4px',
            borderRadius: invalid ? 12 : undefined,
            boxShadow: invalid ? `inset 0 0 0 1.5px ${c.danger}` : undefined,
            backgroundColor: invalid ? c.dangerSoft : undefined,
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: autoScrollActive ? 'x proximity' : 'none',
            scrollPaddingLeft: STRIP_CONTENT_INSET_PX,
            scrollPaddingRight: STRIP_CONTENT_INSET_PX,
            overscrollBehaviorX: 'contain',
          }}
        >
          <div
            aria-hidden
            style={{ flexShrink: 0, width: STRIP_CONTENT_INSET_PX, scrollSnapAlign: 'none' }}
          />
          {ordered.map(cat => (
            <div
              key={cat.id}
              ref={node => {
                if (node) chipRefs.current.set(cat.id, node);
                else chipRefs.current.delete(cat.id);
              }}
              role="option"
              aria-selected={cat.id === activeId}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <CategorySelectPill
                categoryId={cat.id}
                name={cat.name}
                bg={cat.bg}
                color={cat.color}
                iconColor={cat.iconColor}
                selected={cat.id === activeId}
                onSelect={() => onSelect(cat.id)}
                emphasis="solid"
              />
            </div>
          ))}
          <div
            aria-hidden
            style={{ flexShrink: 0, width: STRIP_CONTENT_INSET_PX, scrollSnapAlign: 'none' }}
          />
        </div>
        <div aria-hidden style={fadeEdge('left')} />
        <div aria-hidden style={fadeEdge('right')} />
      </div>
    </div>
  );
}
