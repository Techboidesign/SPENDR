import { useApp } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import type { ExpenseType } from '../../data/types';
import {
  EXPENSE_TYPE_LABEL,
  categoryExpenseBadge,
  expenseMetaBadgeStyle,
  expenseTypeBadge,
} from '../../theme/darkModeUi';
import { categoryPillLabel } from '../shared/CategorySelectPill';

export function ExpenseRowMetaBadges({
  categoryId,
  expenseType,
}: {
  categoryId: string;
  expenseType: ExpenseType;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const { getCategory } = useApp();
  const category = getCategory(categoryId);
  const categoryBadge = categoryExpenseBadge(category, isDark, isDark ? c.surface : c.canvas);
  const typeBadge = expenseTypeBadge(expenseType, c, isDark);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        style={{
          ...expenseMetaBadgeStyle,
          color: categoryBadge.color,
          backgroundColor: categoryBadge.bg,
        }}
      >
        {categoryPillLabel(category.name)}
      </span>
      <span
        style={{
          ...expenseMetaBadgeStyle,
          color: typeBadge.color,
          backgroundColor: typeBadge.bg,
        }}
      >
        {EXPENSE_TYPE_LABEL[expenseType]}
      </span>
    </div>
  );
}
