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
}: {
  categoryId: string;
  expenseType: ExpenseType;
  dateLabel: string;
  showMoreDetails: boolean;
  onToggleMoreDetails: () => void;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const { getCategory } = useApp();
  const category = getCategory(categoryId);
  const categoryColors = categoryExpenseBadge(category, isDark);
  const typeColors = expenseTypeBadge(expenseType, c, isDark);
  const dateColors = dateSummaryBadge(isDark, c);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        paddingTop: 4,
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            ...summaryBadgeStyle,
            color: categoryColors.color,
            backgroundColor: categoryColors.bg,
          }}
        >
          {categoryPillLabel(category.name)}
        </span>
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

      <button
        type="button"
        onClick={onToggleMoreDetails}
        aria-label={showMoreDetails ? 'Less details' : 'More details'}
        aria-expanded={showMoreDetails}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 36,
          padding: 0,
          borderRadius: 10,
          border: `1px solid ${isDark ? c.accentBorder : c.accentSoft}`,
          backgroundColor: c.accentSoft,
          color: c.accent,
          cursor: 'pointer',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        {showMoreDetails ? (
          <CaretUp size={22} weight="bold" aria-hidden />
        ) : (
          <CaretDown size={22} weight="bold" aria-hidden />
        )}
      </button>
    </div>
  );
}
