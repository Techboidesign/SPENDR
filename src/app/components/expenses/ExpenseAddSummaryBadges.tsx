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
  align = 'center',
  compact = false,
  showBadges = true,
}: {
  categoryId: string | null;
  expenseType: ExpenseType;
  dateLabel: string;
  align?: 'center' | 'end';
  compact?: boolean;
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
    </div>
  );
}
