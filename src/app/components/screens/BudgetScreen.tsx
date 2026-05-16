import { useState, useMemo } from 'react';
import { Edit2, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApp, getCategoryTotals } from '../../context/AppContext';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { CategoryIcon } from '../CategoryIcon';

// Dynamic current month
const today = new Date();
const CURRENT_MONTH = today.toISOString().slice(0, 7);
const MONTH_LABEL = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function EditableAmount({
  value,
  onSave,
  prefix = '€',
  isEditing,
  onEditToggle,
}: {
  value: number;
  onSave: (v: number) => void;
  prefix?: string;
  isEditing: boolean;
  onEditToggle: () => void;
}) {
  const [draft, setDraft] = useState(value.toString());

  const handleSave = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
    onEditToggle();
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#3E37FF' }}>{prefix}</span>
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{
            width: 100, fontSize: 22, fontWeight: 800, color: '#1A1A2E',
            border: 'none', borderBottom: '2px solid #3E37FF',
            background: 'transparent', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSave}
          style={{ background: '#3E37FF', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
        >
          <Check size={14} color="#fff" />
        </button>
      </div>
    );
  }

  return (
    <span style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E' }}>
      {prefix}{value.toLocaleString('de-DE', { minimumFractionDigits: 0 })}
    </span>
  );
}

function CategoryBudgetRow({
  categoryId,
  spent,
  budgeted,
  onSetBudget,
  formatCurrency,
}: {
  categoryId: string;
  spent: number;
  budgeted: number;
  onSetBudget: (id: string, amount: number) => void;
  formatCurrency: (n: number) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budgeted.toString());
  const cat = getCategoryById(categoryId);

  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
  const isOver = spent > budgeted && budgeted > 0;
  const isWarning = pct >= 80 && !isOver;

  const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : cat.color;

  const handleSave = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) onSetBudget(categoryId, parsed);
    setEditing(false);
  };

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 12,
      backgroundColor: isOver ? '#FEF2F2' : '#F7F7FA',
      border: isOver ? '1px solid #FEE2E2' : '1px solid transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <CategoryIcon categoryId={categoryId} size="xs" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{cat.name}</span>
            {isOver && <AlertTriangle size={12} color="#EF4444" />}
            {isWarning && <AlertTriangle size={12} color="#F59E0B" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ fontSize: 11, color: isOver ? '#EF4444' : '#6B7280', fontWeight: isOver ? 600 : 400 }}>
              {formatCurrency(spent)} spent
            </span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>of</span>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#3E37FF' }}>€</span>
                <input
                  autoFocus
                  type="number"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  style={{
                    width: 60, fontSize: 11, fontWeight: 600,
                    border: 'none', borderBottom: '1px solid #3E37FF',
                    background: 'transparent', outline: 'none', fontFamily: 'inherit',
                    color: '#1A1A2E',
                  }}
                />
              </div>
            ) : (
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {budgeted > 0 ? formatCurrency(budgeted) : 'not set'}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#1A1A2E',
          }}>
            {pct.toFixed(0)}%
          </span>
          <br />
          <button
            onClick={() => { setDraft(budgeted.toString()); setEditing(!editing); }}
            style={{
              fontSize: 10, fontWeight: 600, color: '#3E37FF',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontFamily: 'inherit',
            }}
          >
            {editing ? 'Cancel' : budgeted > 0 ? 'Edit' : 'Set'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: barColor,
          borderRadius: 3,
          animation: 'progressBarFill 0.8s ease-out both',
        }} />
      </div>

      {budgeted > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>€0</span>
          <span style={{ fontSize: 10, color: isOver ? '#EF4444' : '#9CA3AF', fontWeight: isOver ? 600 : 400 }}>
            {isOver ? `€${(spent - budgeted).toFixed(0)} over limit` : `€${(budgeted - spent).toFixed(0)} remaining`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function BudgetScreen() {
  const { state, dispatch, formatCurrency } = useApp();
  const [editingIncome, setEditingIncome] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  const categoryTotals = useMemo(
    () => getCategoryTotals(state.expenses, CURRENT_MONTH),
    [state.expenses]
  );

  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals]
  );

  const budgetPct = Math.min((totalSpent / state.monthlyBudget) * 100, 100);
  const budgetColor = budgetPct < 60 ? '#10B981' : budgetPct < 85 ? '#F59E0B' : '#EF4444';
  const savingsAmt = state.income - totalSpent;

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F7F7FA', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px 20px 16px', borderBottom: '1px solid #F0F0F5',
        animation: 'fadeIn 0.5s ease-out both' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Budget & Goals</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{MONTH_LABEL}</p>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Income card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.1s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Monthly Income</p>
            <button
              onClick={() => setEditingIncome(!editingIncome)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EDEDFF';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F0F5';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                background: '#F0F0F5',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.2s ease',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit2 size={14} color="#3E37FF" />
            </button>
          </div>
          <EditableAmount
            value={state.income}
            onSave={v => dispatch({ type: 'SET_INCOME', amount: v })}
            isEditing={editingIncome}
            onEditToggle={() => setEditingIncome(!editingIncome)}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1, backgroundColor: '#F0FDF4', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: '#10B981', fontWeight: 600, margin: '0 0 2px', letterSpacing: 0.3 }}>SAVED</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: savingsAmt >= 0 ? '#10B981' : '#EF4444', margin: 0 }}>
                {formatCurrency(Math.abs(savingsAmt))}
              </p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#F7F7FA', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, margin: '0 0 2px', letterSpacing: 0.3 }}>SPENT</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        {/* Monthly budget card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Monthly Budget Limit</p>
            <button
              onClick={() => setEditingBudget(!editingBudget)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EDEDFF';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F0F5';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                background: '#F0F0F5',
                border: 'none',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.2s ease',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit2 size={14} color="#3E37FF" />
            </button>
          </div>
          <EditableAmount
            value={state.monthlyBudget}
            onSave={v => dispatch({ type: 'SET_BUDGET', amount: v })}
            isEditing={editingBudget}
            onEditToggle={() => setEditingBudget(!editingBudget)}
          />

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{formatCurrency(totalSpent)} spent</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: budgetColor }}>
                {budgetPct.toFixed(0)}% used
              </span>
            </div>
            <div style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${budgetPct}%`,
                background: budgetPct < 60
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : budgetPct < 85
                  ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                  : 'linear-gradient(90deg, #EF4444, #F87171)',
                borderRadius: 5,
                animation: 'progressBarFill 1s ease-out 0.3s both',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>€0</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatCurrency(state.monthlyBudget)}</span>
            </div>
          </div>
        </div>

        {/* Per-category budgets */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.6s ease-out 0.3s both' }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Category Budgets</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map((cat, i) => {
              const goal = state.budgetGoals.find(g => g.categoryId === cat.id);
              const spent = categoryTotals[cat.id] ?? 0;
              return (
                <div key={cat.id} style={{ animation: `fadeSlideLeft 0.5s ease-out ${0.4 + i * 0.05}s both` }}>
                  <CategoryBudgetRow
                    categoryId={cat.id}
                    spent={spent}
                    budgeted={goal?.amount ?? 0}
                    onSetBudget={(id, amount) => dispatch({ type: 'SET_CATEGORY_BUDGET', categoryId: id, amount })}
                    formatCurrency={formatCurrency}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget tips */}
        <div style={{
          backgroundColor: '#EDEDFF', borderRadius: 16, padding: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
          animation: 'fadeSlideUp 0.6s ease-out 0.4s both',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, backgroundColor: '#3E37FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingUp size={18} color="#FFFFFF" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#3E37FF', margin: '0 0 3px' }}>Budget Insight</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              You're on track to save{' '}
              <strong style={{ color: '#10B981' }}>{formatCurrency(savingsAmt)}</strong> this month.
              {budgetPct > 80
                ? ' You\'re close to your budget limit — consider reducing discretionary spending.'
                : ' Keep up the great work!'}
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideLeft {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progressBarFill {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
}
