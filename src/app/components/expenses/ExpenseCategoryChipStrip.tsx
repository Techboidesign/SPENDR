import { useMemo, type CSSProperties } from 'react';
import type { Expense } from '../../data/types';
import { isSpendingExpense } from '../../data/focusCategory';
import { CategorySelectPill } from '../shared/CategorySelectPill';
import { useAppColors } from '../../context/AppearanceContext';

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

/** Recent first (stable recency order), then the rest in catalog order — selection does not reorder chips. */
export function orderCategoriesForChipStrip(
  categories: CategoryChipOption[],
  recentIds: string[],
): CategoryChipOption[] {
  const byId = new Map(categories.map(c => [c.id, c]));
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

  return ordered;
}

export function ExpenseCategoryChipStrip({
  categories,
  selectedId,
  onSelect,
  recentIds,
}: {
  categories: CategoryChipOption[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
  recentIds: string[];
}) {
  const c = useAppColors();

  const ordered = useMemo(
    () => orderCategoriesForChipStrip(categories, recentIds),
    [categories, recentIds],
  );

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
        style={{
          margin: '0 0 8px',
          fontSize: 11,
          fontWeight: 600,
          color: c.textMuted,
          letterSpacing: 0.4,
        }}
      >
        CATEGORY
      </p>
      <div
        style={{
          position: 'relative',
          marginLeft: -STRIP_CONTENT_INSET_PX,
          marginRight: -STRIP_CONTENT_INSET_PX,
        }}
      >
        <div
          className="expense-category-chip-strip"
          role="listbox"
          aria-label="Category"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity',
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
              role="option"
              aria-selected={cat.id === selectedId}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <CategorySelectPill
                categoryId={cat.id}
                name={cat.name}
                bg={cat.bg}
                color={cat.color}
                iconColor={cat.iconColor}
                selected={cat.id === selectedId}
                onSelect={() => onSelect(cat.id)}
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
