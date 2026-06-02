import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import type { AppColorPalette } from '../../theme/appColors';
import type { ExpenseType } from '../../data/types';
import {
  EXPENSE_TYPE_LABEL,
  categoryExpenseBadge,
  expenseMetaBadgeStyle,
  expenseTypeBadge,
} from '../../theme/darkModeUi';
import { categoryPillLabel } from '../shared/CategorySelectPill';

function dateSummaryBadge(isDark: boolean, c: AppColorPalette) {
  return isDark
    ? { color: c.textSecondary, bg: c.surfaceInset }
    : { color: '#4B5563', bg: '#E8E8EF' };
}

const summaryBadgeStyle = {
  ...expenseMetaBadgeStyle,
  fontSize: 10,
  padding: '3px 8px',
  borderRadius: 6,
} as const;

export function ExpenseAddSummaryBadges({
  categoryId,
  expenseType,
  dateLabel,
  showMoreDetails,
  onToggleMoreDetails,
  align = 'center',
  compact = false,
  showToggle = true,
  showBadges = true,
}: {
  categoryId: string | null;
  expenseType: ExpenseType;
  dateLabel: string;
  showMoreDetails: boolean;
  onToggleMoreDetails: () => void;
  align?: 'center' | 'end';
  compact?: boolean;
  showToggle?: boolean;
  showBadges?: boolean;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const { getCategory } = useApp();
  const hasCategory = Boolean(categoryId);
  const category = hasCategory ? getCategory(categoryId!) : null;
  const categoryColors = category
    ? categoryExpenseBadge(category, isDark)
    : { color: c.textMuted, bg: c.surfaceInset };
  const typeColors = expenseTypeBadge(expenseType, c, isDark);
  const dateColors = dateSummaryBadge(isDark, c);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'end' ? 'flex-end' : 'center',
        gap: compact ? 8 : 10,
        paddingTop: compact ? 0 : 4,
        paddingBottom: compact ? 0 : 24,
      }}
    >
      {showBadges ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: align === 'end' ? 'flex-end' : 'center',
            gap: 6,
          }}
        >
          {hasCategory && category ? (
            <span
              style={{
                ...summaryBadgeStyle,
                color: categoryColors.color,
                backgroundColor: categoryColors.bg,
              }}
            >
              {categoryPillLabel(category.name)}
            </span>
          ) : null}
          <span
            style={{
              ...summaryBadgeStyle,
              color: typeColors.color,
              backgroundColor: typeColors.bg,
            }}
          >
            {EXPENSE_TYPE_LABEL[expenseType]}
          </span>
          <span
            style={{
              ...summaryBadgeStyle,
              color: dateColors.color,
              backgroundColor: dateColors.bg,
            }}
          >
            {dateLabel}
          </span>
        </div>
      ) : null}

      {showToggle ? (
        <button
          type="button"
          onClick={onToggleMoreDetails}
          aria-label={showMoreDetails ? 'Less details' : 'More details'}
          aria-expanded={showMoreDetails}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 36,
            padding: '0 12px',
            borderRadius: 10,
            border: `1px solid ${isDark ? c.accentBorder : c.accentSoft}`,
            backgroundColor: c.accentSoft,
            color: c.accent,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {showMoreDetails ? 'Less Details' : 'More Details'}
          </span>
          {showMoreDetails ? (
            <CaretUp size={20} weight="bold" aria-hidden />
          ) : (
            <CaretDown size={20} weight="bold" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}
