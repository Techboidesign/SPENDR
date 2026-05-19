import { useMemo } from 'react';
import { Expense } from '../../data/types';
import { getMonthExpenses } from '../../context/AppContext';
import { getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';
import type { HomeRange } from '../../utils/periods';

const TRANSACTION_CARD_SHADOW = '0 2px 10px rgba(0,0,0,0.05)';

function TransactionCard({
  expense,
  formatCurrency,
}: {
  expense: Expense;
  formatCurrency: (n: number) => string;
}) {
  const cat = getCategoryById(expense.categoryId);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        boxShadow: TRANSACTION_CARD_SHADOW,
      }}
    >
      <CategoryIcon categoryId={expense.categoryId} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1A1A2E',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {expense.name}
        </p>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{cat.name}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
          -{formatCurrency(expense.amount)}
        </p>
        {expense.type !== 'one-time' && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 2,
              fontSize: 9,
              fontWeight: 600,
              color: expense.type === 'monthly' ? '#D97706' : '#7C3AED',
              backgroundColor: expense.type === 'monthly' ? '#FEF3C7' : '#EDE9FE',
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
      <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '12px 0 4px' }}>
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
