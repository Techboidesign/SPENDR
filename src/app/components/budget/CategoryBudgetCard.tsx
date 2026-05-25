import { CaretRight } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
import {
  getBudgetProgressColor,
  getBudgetUsagePercent,
} from '../../utils/budgetProgress';
import { CircularProgress } from './CircularProgress';

export function CategoryBudgetCard({
  categoryId,
  spent,
  budgeted,
  formatCurrency,
  onClick,
  animationDelay = 0,
}: {
  categoryId: string;
  spent: number;
  budgeted: number;
  formatCurrency: (n: number) => string;
  onClick: () => void;
  animationDelay?: number;
}) {
  const c = useAppColors();
  const cat = getCategoryById(categoryId);
  const usagePercent = getBudgetUsagePercent(spent, budgeted);
  const isOver = budgeted > 0 && spent > budgeted;
  const progressColor = getBudgetProgressColor(usagePercent);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        backgroundColor: c.surface,
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        boxShadow: c.shadowCard,
      }}
    >
      <CategoryIcon categoryId={categoryId} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: '0 0 4px' }}>{cat.name}</p>
        <p style={{ fontSize: 12, color: c.textFaint, margin: 0 }}>
          {budgeted > 0 ? (
            <>
              <span
                className="font-figure"
                style={{ fontSize: 13, color: isOver ? progressColor : c.textMuted }}
              >
                {formatCurrency(spent)}
              </span>
              {' of '}
              {formatCurrency(budgeted)}
            </>
          ) : (
            <span>{formatCurrency(spent)} spent · tap to set budget</span>
          )}
        </p>
      </div>
      <CircularProgress
        percent={budgeted > 0 ? usagePercent : 0}
        size={52}
        animationDelay={animationDelay}
      />
      <CaretRight size={16} weight="light" color={c.textFaint} aria-hidden style={{ flexShrink: 0 }} />
    </button>
  );
}
