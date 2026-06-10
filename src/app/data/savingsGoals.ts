import { generateId } from '../utils/id';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_OPTIONS,
  type CategoryIconKey,
} from './categoryConfig';
import type { AppState, SavingsGoal } from './types';

export interface SavingsGoalTemplate {
  templateId: string;
  name: string;
  targetAmount: number;
  iconKey: CategoryIconKey;
  accentColor: string;
  accentBg: string;
}

/** Suggested goals for onboarding — match Budget “Saving goals” cards. */
export const SAVINGS_GOAL_TEMPLATES: SavingsGoalTemplate[] = [
  {
    templateId: 'ps5',
    name: 'PlayStation 5',
    targetAmount: 499,
    iconKey: 'game',
    accentColor: '#4B13E8',
    accentBg: '#EDEDFF',
  },
  {
    templateId: 'bahamas',
    name: 'Vacation in Bahamas',
    targetAmount: 3500,
    iconKey: 'plane',
    accentColor: '#1F8A4F',
    accentBg: '#D1FAE5',
  },
  {
    templateId: 'motorcycle',
    name: 'Motorcycle',
    targetAmount: 8500,
    iconKey: 'bike',
    accentColor: '#EF4444',
    accentBg: '#FEE2E2',
  },
];

/** Random icon + accent for new goals (Add goal). */
export function pickRandomSavingsGoalAppearance(): Pick<
  SavingsGoal,
  'iconKey' | 'accentColor' | 'accentBg'
> {
  const preset =
    CATEGORY_COLOR_PRESETS[Math.floor(Math.random() * CATEGORY_COLOR_PRESETS.length)];
  const icon = CATEGORY_ICON_OPTIONS[Math.floor(Math.random() * CATEGORY_ICON_OPTIONS.length)];
  return {
    iconKey: icon.key,
    accentColor: preset.color,
    accentBg: preset.bg,
  };
}

export function createSavingsGoal(
  partial: Pick<SavingsGoal, 'name'> &
    Partial<Omit<SavingsGoal, 'id' | 'name'>>,
): SavingsGoal {
  return {
    id: generateId(),
    name: partial.name,
    targetAmount: partial.targetAmount ?? 0,
    currentAmount: partial.currentAmount ?? 0,
    targetDate: partial.targetDate ?? '',
    iconKey: partial.iconKey ?? 'piggy',
    accentColor: partial.accentColor ?? '#F7A54D',
    accentBg: partial.accentBg ?? '#FEF5EC',
  };
}

export function savingsGoalFromTemplate(template: SavingsGoalTemplate): SavingsGoal {
  return createSavingsGoal({
    name: template.name,
    targetAmount: template.targetAmount,
    currentAmount: 0,
    iconKey: template.iconKey,
    accentColor: template.accentColor,
    accentBg: template.accentBg,
  });
}

export function migrateSavingsGoals(state: AppState): SavingsGoal[] {
  if (state.savingsGoals?.length) return state.savingsGoals;

  const fromUserGoals = (state.userGoals ?? [])
    .filter(g => g.target?.name || g.target?.targetAmount)
    .map(g =>
      createSavingsGoal({
        name: g.target?.name?.trim() || 'Savings goal',
        targetAmount: g.target?.targetAmount ?? 0,
        currentAmount: g.target?.currentAmount ?? 0,
        targetDate: g.target?.targetDate ?? '',
      }),
    );

  if (fromUserGoals.length > 0) return fromUserGoals;

  if (state.primaryGoalTarget?.targetAmount) {
    return [
      createSavingsGoal({
        name: state.primaryGoalTarget.name?.trim() || 'Savings goal',
        targetAmount: state.primaryGoalTarget.targetAmount,
        currentAmount: state.primaryGoalTarget.currentAmount ?? 0,
        targetDate: state.primaryGoalTarget.targetDate ?? '',
      }),
    ];
  }

  return [];
}
