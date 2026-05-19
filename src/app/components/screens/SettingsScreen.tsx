import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DownloadSimple, UploadSimple,
  Tag, Bell, Question, CaretRight, Check, X, Plus,
  Wallet, Receipt, ShieldCheck, Info, SignOut,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { CategoryIcon } from '../CategoryIcon';
import { CategoryEditModal, NEW_CATEGORY_ID } from '../settings/CategoryEditModal';
import { AnimatedCurrencyIcon } from '../settings/AnimatedCurrencyIcon';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];

const BADGE_TRANSITION = 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease';

function badgeHoverHandlers(baseShadow: string) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translateY(-1px) scale(1.04)';
      e.currentTarget.style.boxShadow =
        baseShadow === 'none' ? '0 3px 12px rgba(0,0,0,0.1)' : `${baseShadow}, 0 3px 12px rgba(0,0,0,0.1)`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = baseShadow;
    },
  };
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.8, padding: '12px 20px 6px', margin: 0 }}>
        {title.toUpperCase()}
      </p>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon, iconBg, iconColor, label, value, onClick, danger, last,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        width: '100%', border: 'none', background: 'none', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : '1px solid #F7F7FA',
        textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} weight="light" color={danger ? '#EF4444' : iconColor} />
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: danger ? '#EF4444' : '#1A1A2E' }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: '#9CA3AF' }}>{value}</span>}
      {onClick && <CaretRight size={15} weight="light" color="#D1D5DB" />}
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        backgroundColor: value ? '#3E37FF' : '#D1D5DB',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

/* ── Inline-editable finance row ── */
function InlineEditRow({
  icon: Icon, iconBg, iconColor, label, amount, onSave, last,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  amount: number;
  onSave: (v: number) => void;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(amount));

  const handleSave = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) onSave(n);
    setOpen(false);
  };

  const handleToggle = () => {
    setDraft(String(amount));
    setOpen(v => !v);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px', width: '100%',
          border: 'none', background: 'none', cursor: 'pointer',
          borderBottom: (!last && !open) ? '1px solid #F7F7FA' : 'none',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} weight="light" color={iconColor} />
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1A1A2E' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? '#3E37FF' : '#9CA3AF' }}>€{amount.toLocaleString()}</span>
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: open ? '#3E37FF' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          marginLeft: 2,
          transition: 'background-color 0.2s',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="M2 3.5l3 3 3-3" stroke={open ? '#FFFFFF' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{
          padding: '10px 16px 14px',
          backgroundColor: '#F7F7FA',
          borderBottom: last ? 'none' : '1px solid #F0F0F5',
          borderTop: '1px solid #F0F0F5',
        }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 8px', fontWeight: 500 }}>
            Enter new {label.toLowerCase()}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, fontWeight: 600, color: '#9CA3AF',
              }}>€</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="50"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setOpen(false); }}
                style={{
                  width: '100%', height: 44, paddingLeft: 28, paddingRight: 12,
                  borderRadius: 10, border: '2px solid #3E37FF',
                  fontSize: 16, fontWeight: 700, color: '#1A1A2E',
                  outline: 'none', background: '#FFFFFF',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleSave}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                backgroundColor: '#3E37FF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Check size={18} weight="light" color="#FFFFFF" />
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                backgroundColor: '#F0F0F5', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={18} weight="light" color="#9CA3AF" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Screen ── */
export default function SettingsScreen() {
  const { state, dispatch, categories } = useApp();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useOnboarding();

  const handleLogOut = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [recurringReminders, setRecurringReminders] = useState(true);
  const [exportToast, setExportToast] = useState('');

  const handleExportCSV = () => {
    try {
      // Create CSV header
      const headers = ['Date', 'Name', 'Amount', 'Category', 'Type'];

      // Create CSV rows
      const rows = state.expenses.map(exp => {
        const category = categories.find(c => c.id === exp.categoryId);
        return [
          exp.date,
          exp.name,
          exp.amount,
          category?.name || exp.categoryId,
          exp.type
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `spendr-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportToast(`✓ Exported ${state.expenses.length} expenses as CSV`);
      setTimeout(() => setExportToast(''), 2500);
    } catch (error) {
      setExportToast('✗ Export failed');
      setTimeout(() => setExportToast(''), 2500);
    }
  };

  const handleExportPDF = () => {
    try {
      // Create a simple text-based report
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Group expenses by category
      const categoryTotals: Record<string, { name: string; amount: number; count: number }> = {};
      state.expenses.forEach(exp => {
        const cat = categories.find(c => c.id === exp.categoryId);
        const catName = cat?.name || exp.categoryId;
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, amount: 0, count: 0 };
        }
        categoryTotals[catName].amount += exp.amount;
        categoryTotals[catName].count += 1;
      });

      const totalSpent = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Create PDF-style HTML content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Spendr Expense Report</title>
  <style>
    body { font-family: 'Space Grotesk', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #3E37FF; font-size: 28px; margin-bottom: 8px; }
    .subtitle { color: #9CA3AF; font-size: 14px; margin-bottom: 32px; }
    .summary { background: #F7F7FA; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
    .summary-item { display: flex; justify-content: space-between; margin: 8px 0; }
    .summary-label { color: #6B7280; }
    .summary-value { font-weight: 700; color: #1A1A2E; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #F7F7FA; padding: 12px; text-align: left; font-size: 12px; color: #6B7280; border-bottom: 2px solid #E5E7EB; }
    td { padding: 12px; border-bottom: 1px solid #F0F0F5; }
    .amount { font-weight: 700; color: #1A1A2E; }
    .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Spendr Expense Report</h1>
  <div class="subtitle">Generated on ${today}</div>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Total Expenses</span>
      <span class="summary-value">${state.expenses.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Total Spent</span>
      <span class="summary-value">${state.currency === 'EUR' ? '€' : state.currency === 'USD' ? '$' : state.currency === 'GBP' ? '£' : state.currency}${totalSpent.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Monthly Budget</span>
      <span class="summary-value">${state.currency === 'EUR' ? '€' : state.currency === 'USD' ? '$' : state.currency === 'GBP' ? '£' : state.currency}${state.monthlyBudget.toFixed(2)}</span>
    </div>
  </div>

  <h2 style="font-size: 18px; margin-bottom: 16px;">Expenses by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Count</th>
        <th>Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${Object.values(categoryTotals).sort((a, b) => b.amount - a.amount).map(cat => `
        <tr>
          <td>${cat.name}</td>
          <td>${cat.count}</td>
          <td class="amount">${state.currency === 'EUR' ? '€' : state.currency === 'USD' ? '$' : state.currency === 'GBP' ? '£' : state.currency}${cat.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>© 2026 Spendr by Alejandro Alvarez</p>
  </div>
</body>
</html>`;

      // Create blob and download as HTML (which can be printed to PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `spendr-report-${new Date().toISOString().slice(0, 10)}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportToast('✓ Report downloaded (open and print to PDF)');
      setTimeout(() => setExportToast(''), 3000);
    } catch (error) {
      setExportToast('✗ Export failed');
      setTimeout(() => setExportToast(''), 2500);
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());

          // Skip header row
          const dataLines = lines.slice(1);

          let imported = 0;
          dataLines.forEach(line => {
            // Parse CSV line (handle quoted fields)
            const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 5) return;

            const [date, name, amount, category, type] = matches.map(m => m.replace(/^"|"$/g, '').trim());

            // Find category by name
            const categoryObj = categories.find(c => c.name === category);
            if (!categoryObj) return;

            // Validate data
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) return;
            if (!['one-time', 'monthly', 'yearly'].includes(type)) return;

            // Add expense
            dispatch({
              type: 'ADD_EXPENSE',
              expense: {
                id: `imp-${Date.now()}-${Math.random()}`,
                name,
                amount: parsedAmount,
                categoryId: categoryObj.id,
                date,
                type: type as 'one-time' | 'monthly' | 'yearly',
              }
            });
            imported++;
          });

          setExportToast(`✓ Imported ${imported} expenses`);
          setTimeout(() => setExportToast(''), 2500);
        } catch (error) {
          setExportToast('✗ Import failed - check CSV format');
          setTimeout(() => setExportToast(''), 2500);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F7F7FA', paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px 20px 16px', borderBottom: '1px solid #F0F0F5' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Settings</h1>
      </div>

      {/* Toast */}
      {exportToast && (
        <div style={{
          position: 'absolute', top: 80, left: 16, right: 16,
          backgroundColor: '#1A1A2E', color: '#FFFFFF',
          borderRadius: 12, padding: '12px 16px',
          fontSize: 13, fontWeight: 500,
          zIndex: 300, textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {exportToast}
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Profile card ── */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => navigate('/settings/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              backgroundColor: '#FFFFFF', borderRadius: 16,
              padding: '16px', width: '100%',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            {state.userAvatar ? (
              <img src={state.userAvatar} alt="avatar" style={{ width: 52, height: 52, borderRadius: 26, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 26,
                background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(62,55,255,0.3)',
              }}>
                {state.userName[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{state.userFullName}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{state.userUsername} · Personal</p>
            </div>
            <CaretRight size={18} weight="light" color="#D1D5DB" />
          </button>
        </div>

        {/* ── Preferences ── */}
        <SettingsSection title="Preferences">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                width: '100%',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: showCurrencyPicker ? 'none' : '1px solid #F7F7FA',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FAFAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <AnimatedCurrencyIcon currency={state.currency} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1A1A2E' }}>Currency</span>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{state.currency}</span>
              <CaretRight size={15} weight="light" color="#D1D5DB" />
            </button>
            {showCurrencyPicker && (
              <div style={{ backgroundColor: '#F7F7FA', borderRadius: '0 0 16px 16px', padding: '8px 16px 12px', borderTop: '1px solid #F0F0F5' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CURRENCIES.map(c => {
                    const selected = state.currency === c;
                    const shadow = selected ? '0 0 0 2px #3E37FF' : '0 1px 4px rgba(0,0,0,0.08)';
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { dispatch({ type: 'SET_CURRENCY', currency: c }); setShowCurrencyPicker(false); }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 20,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          backgroundColor: selected ? '#EDEDFF' : '#FFFFFF',
                          color: selected ? '#3E37FF' : '#6B7280',
                          boxShadow: shadow,
                          fontFamily: 'inherit',
                          transition: BADGE_TRANSITION,
                        }}
                        {...badgeHoverHandlers(shadow)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div style={{ borderTop: '1px solid #F7F7FA' }}>
            <div style={{ padding: '12px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={16} weight="light" color="#EC4899" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', flex: 1 }}>Categories</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(cat => {
                  const displayColor = cat.iconColor || cat.color;
                  const pillShadow = `0 1px 3px ${displayColor}18`;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditingCategoryId(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 14px 2px 4px',
                        borderRadius: 20,
                        backgroundColor: cat.bg,
                        border: `1px solid ${displayColor}20`,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: pillShadow,
                        transition: BADGE_TRANSITION,
                      }}
                      {...badgeHoverHandlers(pillShadow)}
                    >
                      <CategoryIcon categoryId={cat.id} size="xs" />
                      <span style={{ fontSize: 11, fontWeight: 500, color: displayColor }}>
                        {cat.name.split('/')[0].split(' & ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setEditingCategoryId(NEW_CATEGORY_ID)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  padding: '6px 12px 6px 8px',
                  borderRadius: 20,
                  border: '1px dashed #D1D5DB',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: BADGE_TRANSITION,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.04)';
                  e.currentTarget.style.borderColor = '#3E37FF';
                  e.currentTarget.style.backgroundColor = '#EDEDFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus size={14} weight="bold" color="#3E37FF" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3E37FF' }}>Add Category</span>
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* ── Data management ── */}
        <SettingsSection title="Data">
          <SettingsRow icon={DownloadSimple} iconBg="#D1FAE5" iconColor="#10B981" label="Export as CSV" onClick={handleExportCSV} />
          <SettingsRow icon={DownloadSimple} iconBg="#DBEAFE" iconColor="#3B82F6" label="Export as PDF" onClick={handleExportPDF} />
          <SettingsRow icon={UploadSimple} iconBg="#FEF3C7" iconColor="#D97706" label="Import from CSV" onClick={handleImportCSV} last />
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection title="Notifications">
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F7F7FA' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={16} weight="light" color="#EF4444" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1A1A2E' }}>Budget Alerts</span>
            <Toggle value={budgetAlerts} onChange={setBudgetAlerts} />
          </div>
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={16} weight="light" color="#D97706" />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1A1A2E' }}>Recurring Reminders</span>
            <Toggle value={recurringReminders} onChange={setRecurringReminders} />
          </div>
        </SettingsSection>

        {/* ── Account ── */}
        <SettingsSection title="Account">
          <SettingsRow
            icon={SignOut}
            iconBg="#FFF7ED"
            iconColor="#F97316"
            label="Log Out"
            onClick={handleLogOut}
            danger
            last
          />
        </SettingsSection>

        {/* ── About ── */}
        <SettingsSection title="About">
          <SettingsRow
            icon={Question} iconBg="#F0FDF4" iconColor="#16A34A"
            label="Help & Support"
            onClick={() => navigate('/settings/help')}
          />
          <SettingsRow
            icon={ShieldCheck} iconBg="#F0F9FF" iconColor="#0284C7"
            label="Privacy Policy"
            onClick={() => navigate('/settings/privacy')}
            last
          />
        </SettingsSection>

        {/* ── App branding ── */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: 16,
          padding: '16px', marginBottom: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(62,55,255,0.25)',
          }}>
            <Wallet size={22} weight="light" color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Spendr</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
              By Alejandro Alvarez · <a href="https://www.techboi.design" target="_blank" rel="noopener noreferrer" style={{ color: '#3E37FF', fontWeight: 600, textDecoration: 'none' }}>www.techboi.design</a>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              backgroundColor: '#F7F7FA', borderRadius: 8,
              padding: '4px 10px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>v1.0.0</span>
            </div>
          </div>
        </div>

        {/* ── Legal ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0 4px' }}>
          <Info size={12} weight="light" color="#D1D5DB" />
          <p style={{ fontSize: 11, color: '#D1D5DB', margin: 0 }}>
            © 2026 Alejandro Alvarez. All rights reserved.
          </p>
        </div>

      </div>

      <CategoryEditModal
        open={editingCategoryId !== null}
        categoryId={editingCategoryId}
        onClose={() => setEditingCategoryId(null)}
      />
    </div>
  );
}