import { CaretRight } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { CATEGORY_ICON_MAP } from '../../data/categoryConfig';
import type { SavingsGoal } from '../../data/types';
import { AppIconChip } from '../ui/AppIconChip';
import {
  getBudgetProgressColor,
  getBudgetUsagePercent,
} from '../../utils/budgetProgress';
import { CircularProgress } from './CircularProgress';

export function SavingsGoalCard({
  goal,
  formatCurrency,
  animationDelay = 0,
  onEdit,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  goal: SavingsGoal;
  formatCurrency: (n: number) => string;
  animationDelay?: number;
  onEdit?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const c = useAppColors();
  const Icon = CATEGORY_ICON_MAP[goal.iconKey] ?? CATEGORY_ICON_MAP.piggy;
  const saved = goal.currentAmount;
  const target = goal.targetAmount;
  const usagePercent = getBudgetUsagePercent(saved, target);
  const progressColor = getBudgetProgressColor(usagePercent);
  const interactive = selectable ? onToggleSelect != null : onEdit != null;

  const handleClick = () => {
    if (selectable) onToggleSelect?.();
    else onEdit?.();
  };

  return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!interactive}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 16px',
          backgroundColor: c.surface,
          borderRadius: 16,
          border: selectable && selected ? `2px solid ${goal.accentColor}` : 'none',
          cursor: interactive ? 'pointer' : 'default',
          fontFamily: 'inherit',
          textAlign: 'left',
          boxShadow: c.shadowCard,
        }}
      >
        <AppIconChip
          icon={Icon}
          accentColor={goal.accentColor}
          lightBg={goal.accentBg}
          size={40}
          iconSize={18}
          radius={12}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: '0 0 4px' }}>
            {goal.name}
          </p>
          <p style={{ fontSize: 12, color: c.textFaint, margin: 0 }}>
            {target > 0 ? (
              <>
                <span
                  className="font-figure"
                  style={{ fontSize: 13, color: saved > target ? progressColor : c.textMuted }}
                >
                  {formatCurrency(saved)}
                </span>
                {' of '}
                {formatCurrency(target)}
              </>
            ) : (
              <span>{formatCurrency(saved)} saved</span>
            )}
          </p>
        </div>
        <CircularProgress
          percent={target > 0 ? usagePercent : 0}
          size={52}
          animationDelay={animationDelay}
        />
        {interactive && !selectable ? (
          <CaretRight size={16} weight="light" color={c.textFaint} aria-hidden style={{ flexShrink: 0 }} />
        ) : null}
      </button>
  );
}
