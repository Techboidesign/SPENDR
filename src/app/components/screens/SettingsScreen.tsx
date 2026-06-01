import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DownloadSimple, UploadSimple, Trash,
  Tag, Bell, Question, CaretRight, Check, X, Plus,
  ChartBar, Receipt, ShieldCheck, Info, SignOut, Target, Moon, Sun,
} from '@phosphor-icons/react';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import type { NotificationPreferences } from '../../data/types';
import { mergeNotificationPreferences } from '../../data/notificationPreferences';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { CategoryIcon } from '../CategoryIcon';
import { AddCustomCategoryButton } from '../settings/AddCustomCategoryButton';
import { CategoryEditModal, NEW_CATEGORY_ID } from '../settings/CategoryEditModal';
import { EraseAllDataModal } from '../settings/EraseAllDataModal';
import { AnimatedCurrencyIcon } from '../settings/AnimatedCurrencyIcon';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { SpendrLogo } from '../auth/SpendrLogo';
import { getFeatureCardTokens, featureCardSurface } from '../ui/featureCard';
import { AppIconChip } from '../ui/AppIconChip';
import { categoryPillStyle, rowHoverBg } from '../../theme/darkModeUi';
import { listRowLabelStyle, sectionTitleStyle } from '../../theme/typography';
import { generateId } from '../../utils/id';

const PROFILE_FEATURE = { accentColor: '#3E37FF', accentBg: '#EDEDFF' };

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
  const c = useAppColors();
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ ...sectionTitleStyle(c), padding: '12px 20px 6px' }}>
        {title.toUpperCase()}
      </p>
      <div style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', boxShadow: c.shadowCard }}>
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
  const c = useAppColors();
  const { isDark } = useAppearance();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        width: '100%', border: 'none', background: 'none', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : `1px solid ${c.divider}`,
        textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <AppIconChip icon={Icon} accentColor={danger ? c.danger : iconColor} lightBg={iconBg} />
      <span style={{ flex: 1, ...listRowLabelStyle(c), color: danger ? c.danger : c.text }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: c.textFaint }}>{value}</span>}
      {onClick && <CaretRight size={15} weight="light" color={c.textFaint} />}
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const c = useAppColors();
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        backgroundColor: value ? c.accent : c.surfaceInset,
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: c.surface,
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
  const c = useAppColors();
  const { isDark } = useAppearance();
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
          borderBottom: (!last && !open) ? `1px solid ${c.divider}` : 'none',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <AppIconChip icon={Icon} accentColor={iconColor} lightBg={iconBg} />
        <span style={{ flex: 1, ...listRowLabelStyle(c) }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? c.accent : c.textFaint }}>€{amount.toLocaleString()}</span>
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: open ? c.accent : c.surfaceInset,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          marginLeft: 2,
          transition: 'background-color 0.2s',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="M2 3.5l3 3 3-3" stroke={open ? c.onAccent : c.textFaint} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{
          padding: '10px 16px 14px',
          backgroundColor: c.canvas,
          borderBottom: last ? 'none' : `1px solid ${c.border}`,
          borderTop: `1px solid ${c.border}`,
        }}>
          <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 8px', fontWeight: 500 }}>
            Enter new {label.toLowerCase()}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, fontWeight: 600, color: c.textFaint,
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
                  borderRadius: 10, border: `1px solid ${c.accent}`,
                  fontSize: 16, fontWeight: 700, color: c.text,
                  outline: 'none', background: c.surface,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleSave}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                backgroundColor: c.accent, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Check size={18} weight="light" color="#FFFFFF" />
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                backgroundColor: c.border, cursor: 'pointer',
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
  const c = useAppColors();
  const fc = getFeatureCardTokens(c);
  const { isDark, setAppearance } = useAppearance();
  const { state, dispatch, categories, eraseAllData } = useApp();
  const prefs = mergeNotificationPreferences(state.notificationPreferences);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useOnboarding();

  const handleLogOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [exportToast, setExportToast] = useState('');
  const [showEraseModal, setShowEraseModal] = useState(false);

  const setNotificationPref = (key: keyof NotificationPreferences, value: boolean) => {
    dispatch({
      type: 'SET_NOTIFICATION_PREFERENCES',
      preferences: { ...prefs, [key]: value },
    });
  };

  const handleExportCSV = (): boolean => {
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
      return true;
    } catch {
      setExportToast('✗ Export failed');
      setTimeout(() => setExportToast(''), 2500);
      return false;
    }
  };

  const handleConfirmErase = async () => {
    try {
      await eraseAllData();
      setExportToast('✓ All data erased');
      setTimeout(() => setExportToast(''), 2500);
    } catch {
      setExportToast('✗ Could not erase data — try again');
      setTimeout(() => setExportToast(''), 2500);
      throw new Error('erase failed');
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
                id: generateId(),
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
    <div
      data-app-scroll
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'none',
        backgroundColor: c.canvas,
        paddingBottom: TAB_BAR_CLEARANCE,
      }}
    >
      {/* Header */}
      <div style={{ backgroundColor: c.surface, padding: '20px 20px 16px', borderBottom: `1px solid ${c.border}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>Settings</h1>
      </div>

      {/* Toast */}
      {exportToast && (
        <div style={{
          position: 'absolute', top: 80, left: 16, right: 16,
          backgroundColor: c.text, color: c.onAccent,
          borderRadius: 12, padding: '12px 16px',
          fontSize: 13, fontWeight: 500,
          zIndex: 300, textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {exportToast}
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Profile card (Feature Card) ── */}
        <div style={{ marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/settings/profile')}
            style={{
              width: '100%',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              ...featureCardSurface(PROFILE_FEATURE.accentBg, c, {
                radius: fc.radiusLg,
                padding: fc.paddingLg,
                isDark,
              }),
            }}
          >
            {state.userAvatar ? (
              <img
                src={state.userAvatar}
                alt=""
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: PROFILE_FEATURE.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                flexShrink: 0,
              }}>
                {state.userName[0]}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, ...fc.eyebrow }}>Profile</p>
              <p style={{ margin: '2px 0 0', ...fc.headline }}>{state.userFullName}</p>
              <p style={{ margin: '2px 0 0', ...fc.detail }}>
                {state.userEmail} · Personal
              </p>
            </div>
            <CaretRight size={18} weight="light" color={PROFILE_FEATURE.accentColor} aria-hidden />
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
                borderBottom: showCurrencyPicker ? 'none' : `1px solid ${c.divider}`,
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = rowHoverBg(isDark, c); }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <AnimatedCurrencyIcon currency={state.currency} />
              <span style={{ flex: 1, ...listRowLabelStyle(c) }}>Currency</span>
              <span style={{ fontSize: 13, color: c.textFaint }}>{state.currency}</span>
              <CaretRight size={15} weight="light" color={c.textFaint} />
            </button>
            {showCurrencyPicker && (
              <div style={{ backgroundColor: c.canvas, borderRadius: '0 0 16px 16px', padding: '8px 16px 12px', borderTop: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CURRENCIES.map(code => {
                    const selected = state.currency === code;
                    const shadow = selected ? `0 0 0 1px ${c.accent}` : c.shadowSm;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => { dispatch({ type: 'SET_CURRENCY', currency: code }); setShowCurrencyPicker(false); }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 20,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          backgroundColor: selected ? c.chipSelectedBg : c.surface,
                          color: selected ? c.chipSelectedText : c.textMuted,
                          boxShadow: shadow,
                          fontFamily: 'inherit',
                          transition: BADGE_TRANSITION,
                        }}
                        {...badgeHoverHandlers(shadow)}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <AppIconChip icon={isDark ? Moon : Sun} accentColor={c.accent} lightBg={c.accentSoft} />
            <span style={{ flex: 1, ...listRowLabelStyle(c) }}>Dark mode</span>
            <Toggle
              value={isDark}
              onChange={next => setAppearance(next ? 'dark' : 'light')}
            />
          </div>

          {/* Categories */}
          <div>
            <div style={{ padding: '12px 16px 14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <AppIconChip icon={Tag} accentColor="#EC4899" lightBg="#FCE7F3" />
                <span style={{ ...listRowLabelStyle(c), flex: 1, minWidth: 0 }}>
                  Categories
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: c.textFaint,
                    letterSpacing: 0.2,
                    flexShrink: 0,
                  }}
                >
                  Tap to edit
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(cat => {
                  const pillStyle = categoryPillStyle(cat, isDark, c);
                  const pillShadow = isDark ? 'none' : `0 1px 3px ${(cat.iconColor || cat.color)}18`;
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
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: BADGE_TRANSITION,
                        ...pillStyle,
                        boxShadow: pillShadow,
                      }}
                      {...badgeHoverHandlers(pillShadow)}
                    >
                      <CategoryIcon categoryId={cat.id} size="xs" tone="light" />
                      <span style={{ fontSize: 11, fontWeight: 500, color: pillStyle.color }}>
                        {cat.name.split('/')[0].split(' & ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <AddCustomCategoryButton onClick={() => setEditingCategoryId(NEW_CATEGORY_ID)} />
            </div>
          </div>
        </SettingsSection>

        {/* ── Data management ── */}
        <SettingsSection title="Data">
          <SettingsRow icon={DownloadSimple} iconBg="#D1FAE5" iconColor="#10B981" label="Export as CSV" onClick={handleExportCSV} />
          <SettingsRow icon={UploadSimple} iconBg="#FEF3C7" iconColor="#D97706" label="Import from CSV" onClick={handleImportCSV} />
          <SettingsRow
            icon={Trash}
            iconBg="#FEE2E2"
            iconColor="#EF4444"
            label="Erase all data"
            onClick={() => setShowEraseModal(true)}
            danger
            last
          />
        </SettingsSection>

        {/* ── Notifications (in-app banners — see Settings → same toggles as onboarding) ── */}
        <SettingsSection title="Notifications">
          {(
            [
              { key: 'budgetAlerts' as const, label: 'Budget alerts', icon: ChartBar, bg: '#FEE2E2', color: '#EF4444' },
              { key: 'weeklySummary' as const, label: 'Weekly summary', icon: Bell, bg: '#FEF3C7', color: '#D97706' },
              { key: 'billReminders' as const, label: 'Bill reminders', icon: Receipt, bg: '#D1FAE5', color: '#059669' },
              { key: 'goalMilestones' as const, label: 'Goal milestones', icon: Target, bg: '#EDE9FE', color: '#7C3AED' },
            ] as const
          ).map((row, index, arr) => {
            const Icon = row.icon;
            return (
              <div
                key={row.key}
                style={{
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: index < arr.length - 1 ? `1px solid ${c.divider}` : undefined,
                }}
              >
                <AppIconChip icon={Icon} accentColor={row.color} lightBg={row.bg} />
                <span style={{ flex: 1, ...listRowLabelStyle(c) }}>{row.label}</span>
                <Toggle
                  value={prefs[row.key]}
                  onChange={v => setNotificationPref(row.key, v)}
                />
              </div>
            );
          })}
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
            label="FAQ"
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
          backgroundColor: c.surface, borderRadius: 16,
          padding: '16px', marginBottom: 8,
          boxShadow: c.shadowCard,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(62,55,255,0.25)',
          }}>
            <SpendrLogo size={36} style={{ borderRadius: 10 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: c.text, margin: 0 }}>Spendr</p>
            <p style={{ fontSize: 11, color: c.textFaint, margin: '2px 0 0' }}>
              By Alejandro Alvarez · <a href="https://www.techboi.design" target="_blank" rel="noopener noreferrer" style={{ color: c.accent, fontWeight: 600, textDecoration: 'none' }}>www.techboi.design</a>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              backgroundColor: c.canvas, borderRadius: 8,
              padding: '4px 10px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.textFaint }}>v1.0.0</span>
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

      <EraseAllDataModal
        open={showEraseModal}
        onClose={() => setShowEraseModal(false)}
        onExport={handleExportCSV}
        onConfirmErase={handleConfirmErase}
        expenseCount={state.expenses.length}
        customCategoryCount={state.customCategories.length}
        customizationCount={Object.keys(state.categoryCustomizations).length}
      />
    </div>
  );
}