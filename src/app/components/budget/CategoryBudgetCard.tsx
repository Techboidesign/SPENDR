import { getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
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
  const cat = getCategoryById(categoryId);
  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;

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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <CategoryIcon categoryId={categoryId} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>{cat.name}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
          {budgeted > 0 ? (
            <>
              <span style={{ fontWeight: 600, color: '#6B7280' }}>{formatCurrency(spent)}</span>
              {' of '}
              {formatCurrency(budgeted)}
            </>
          ) : (
            <span>{formatCurrency(spent)} spent · tap to set budget</span>
          )}
        </p>
      </div>
      <CircularProgress
        percent={budgeted > 0 ? pct : 0}
        color={cat.color}
        size={52}
        animationDelay={animationDelay}
      />
    </button>
  );
}
