import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  ChartBar,
  CreditCard,
  MagnifyingGlass,
  PiggyBank,
  ShieldCheck,
  TrendUp,
} from '@phosphor-icons/react';

export type PrimaryGoalId = 'save' | 'track' | 'debt' | 'emergency' | 'invest' | 'exploring';

export type PrimaryGoalProgressMode =
  | 'savings_rate'
  | 'budget_adherence'
  | 'categories_tracked'
  | 'emergency_fund_proxy'
  | 'invest_readiness'
  | 'setup_completeness';

export interface PrimaryGoalDefinition {
  id: PrimaryGoalId;
  label: string;
  shortLabel: string;
  description: string;
  Icon: PhosphorIcon;
  accentColor: string;
  accentBg: string;
  progressMode: PrimaryGoalProgressMode;
  budgetCardHint?: string;
  categoriesSectionTitle: string;
  emphasizedCategoryIds: string[];
}

const ALL_GOAL_IDS: PrimaryGoalId[] = ['save', 'track', 'debt', 'emergency', 'invest', 'exploring'];

export const PRIMARY_GOAL_BY_ID: Record<PrimaryGoalId, PrimaryGoalDefinition> = {
  save: {
    id: 'save',
    label: 'Save for a goal',
    shortLabel: 'Your focus',
    description: 'Build savings for something specific',
    Icon: PiggyBank,
    accentColor: '#F7A54D',
    accentBg: '#FEF5EC',
    progressMode: 'savings_rate',
    budgetCardHint: 'Leave room to save—stay under budget.',
    categoriesSectionTitle: 'Where you can still save',
    emphasizedCategoryIds: ['other', 'groceries', 'utilities'],
  },
  track: {
    id: 'track',
    label: 'Track my spending',
    shortLabel: 'Your focus',
    description: 'See where my money goes',
    Icon: ChartBar,
    accentColor: '#707BFF',
    accentBg: '#F0F1FF',
    progressMode: 'categories_tracked',
    budgetCardHint: 'Your budget is a map of where money goes.',
    categoriesSectionTitle: 'Where your money goes',
    emphasizedCategoryIds: [],
  },
  debt: {
    id: 'debt',
    label: 'Pay off debt',
    shortLabel: 'Your focus',
    description: 'Get out of debt faster',
    Icon: CreditCard,
    accentColor: '#EF4444',
    accentBg: '#FEE2E2',
    progressMode: 'budget_adherence',
    budgetCardHint: 'Prioritize essentials; shrink discretionary spending.',
    categoriesSectionTitle: 'Keep essentials covered',
    emphasizedCategoryIds: ['rent', 'utilities', 'transport', 'groceries'],
  },
  emergency: {
    id: 'emergency',
    label: 'Build emergency fund',
    shortLabel: 'Your focus',
    description: 'Create financial safety net',
    Icon: ShieldCheck,
    accentColor: '#2D7A26',
    accentBg: '#EEFAEC',
    progressMode: 'emergency_fund_proxy',
    budgetCardHint: 'Aim to set aside about 20% of your budget when you can.',
    categoriesSectionTitle: 'Building your safety net',
    emphasizedCategoryIds: ['other', 'utilities', 'rent'],
  },
  invest: {
    id: 'invest',
    label: 'Start investing',
    shortLabel: 'Your focus',
    description: 'Grow wealth over time',
    Icon: TrendUp,
    accentColor: '#3E37FF',
    accentBg: '#EDEDFF',
    progressMode: 'invest_readiness',
    budgetCardHint: 'Investing starts with spending less than you earn.',
    categoriesSectionTitle: 'Room to grow wealth',
    emphasizedCategoryIds: ['other', 'subscriptions'],
  },
  exploring: {
    id: 'exploring',
    label: 'Just exploring',
    shortLabel: 'Your focus',
    description: 'Not sure yet',
    Icon: MagnifyingGlass,
    accentColor: '#8B8D9E',
    accentBg: '#F2F2F5',
    progressMode: 'setup_completeness',
    budgetCardHint: 'Adjust anytime as you learn what works.',
    categoriesSectionTitle: 'Categories budget limit',
    emphasizedCategoryIds: [],
  },
};

export function parsePrimaryGoal(raw: string | null | undefined): PrimaryGoalId {
  if (raw && ALL_GOAL_IDS.includes(raw as PrimaryGoalId)) {
    return raw as PrimaryGoalId;
  }
  return 'exploring';
}

export function getPrimaryGoalDefinition(goalId: PrimaryGoalId | null | undefined): PrimaryGoalDefinition {
  return PRIMARY_GOAL_BY_ID[parsePrimaryGoal(goalId ?? undefined)];
}

/** Onboarding Step 4 allocation keys → suggested % (sum = 100). */
export const GOAL_ONBOARDING_ALLOCATION_WEIGHTS: Record<
  PrimaryGoalId,
  Record<string, number>
> = {
  save: {
    housing: 28,
    food: 12,
    transportation: 10,
    utilities: 10,
    shopping: 8,
    entertainment: 5,
    savings: 27,
  },
  track: {
    housing: 25,
    food: 15,
    transportation: 10,
    utilities: 10,
    shopping: 12,
    entertainment: 13,
    savings: 15,
  },
  debt: {
    housing: 35,
    food: 12,
    transportation: 12,
    utilities: 12,
    shopping: 5,
    entertainment: 4,
    savings: 20,
  },
  emergency: {
    housing: 28,
    food: 11,
    transportation: 10,
    utilities: 10,
    shopping: 6,
    entertainment: 5,
    savings: 30,
  },
  invest: {
    housing: 28,
    food: 12,
    transportation: 10,
    utilities: 10,
    shopping: 8,
    entertainment: 5,
    savings: 27,
  },
  exploring: {
    housing: 30,
    food: 15,
    transportation: 10,
    utilities: 10,
    shopping: 10,
    entertainment: 5,
    savings: 20,
  },
};

export const DISCRETIONARY_CATEGORY_IDS = ['entertainment', 'shopping', 'dining'] as const;

export interface CategoryLike {
  id: string;
  name: string;
}

/** Render order for Budget category list (does not mutate stored state). */
export function sortCategoriesForPrimaryGoal<T extends CategoryLike>(
  categories: T[],
  goalId: PrimaryGoalId,
  categoryTotals: Record<string, number>,
): T[] {
  const def = PRIMARY_GOAL_BY_ID[goalId];
  const emphasized = new Set(def.emphasizedCategoryIds);

  if (goalId === 'track') {
    return [...categories].sort(
      (a, b) => (categoryTotals[b.id] ?? 0) - (categoryTotals[a.id] ?? 0),
    );
  }

  return [...categories].sort((a, b) => {
    const aEm = emphasized.has(a.id) ? 0 : 1;
    const bEm = emphasized.has(b.id) ? 0 : 1;
    if (aEm !== bEm) return aEm - bEm;
    return a.name.localeCompare(b.name);
  });
}

export function getFocusCategoryId(goalId: PrimaryGoalId, categoryIds: string[]): string | null {
  const emphasized = PRIMARY_GOAL_BY_ID[goalId].emphasizedCategoryIds;
  return emphasized.find(id => categoryIds.includes(id)) ?? null;
}
