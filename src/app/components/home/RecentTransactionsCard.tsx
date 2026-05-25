import { useMemo } from 'react';
import { Expense } from '../../data/types';
import { getMonthExpenses } from '../../context/AppContext';
import { getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
import type { HomeRange } from '../../utils/periods';
import { useAppColors } from '../../context/AppearanceContext';

function TransactionCard({
  expense,
  formatCurrency,
}: {
  expense: Expense;
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const cat = getCategoryById(expense.categoryId);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: c.surface,
        borderRadius: 16,
        boxShadow: c.shadowCard,
      }}
    >
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
        <p style={{ fontSize: 11, color: c.textFaint, margin: '1px 0 0' }}>{cat.name}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p className="font-figure" style={{ fontSize: 15, color: c.text, margin: 0 }}>
          -{formatCurrency(expense.amount)}
        </p>
        {expense.type !== 'one-time' && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 2,
              fontSize: 9,
              fontWeight: 600,
              color: expense.type === 'monthly' ? c.warning : '#7C3AED',
              backgroundColor: expense.type === 'monthly' ? c.warningSoft : '#EDE9FE',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {expense.type === 'monthly' ? 'Monthly' : 'Yearly'}
          </span>
        )}
      </div>
    </div>
  );
}

export function RecentTransactionsList({
  range,
  monthKey,
  yearLabel,
  expenses,
  formatCurrency,
}: {
  range: HomeRange;
  monthKey: string;
  yearLabel: string;
  expenses: Expense[];
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const filtered = useMemo(() => {
    if (range === 'month') {
      return getMonthExpenses(expenses, monthKey).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    }
    return expenses
      .filter(e => e.date.startsWith(String(yearLabel)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, range, monthKey, yearLabel]);

  const display = filtered.slice(0, 5);

  if (display.length === 0) {
    return (
      <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '12px 0 4px' }}>
        No transactions — tap + to add an expense
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {display.map(exp => (
        <TransactionCard key={exp.id} expense={exp} formatCurrency={formatCurrency} />
      ))}
    </div>
  );
}
