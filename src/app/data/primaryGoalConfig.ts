import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  ChartBar,
  CreditCard,
  MagnifyingGlass,
  PiggyBank,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { OnboardingGoalChoice, PrimaryGoalId } from './types';

export type { PrimaryGoalId };

export type PrimaryGoalProgressMode =
  | 'target_amount'
  | 'categories_tracked';

export interface PrimaryGoalDefinition {
  id: PrimaryGoalId;
  label: string;
  shortLabel: string;
  Icon: PhosphorIcon;
  accentColor: string;
  accentBg: string;
  progressMode: PrimaryGoalProgressMode;
  categoriesSectionTitle: string;
  emphasizedCategoryIds: string[];
}

export const PRIMARY_GOAL_IDS: PrimaryGoalId[] = ['save', 'track', 'debt', 'emergency'];

/** Shown only on onboarding step 2 (`exploring` resolves to `track`). */
export const ONBOARDING_GOAL_CHOICES: Array<{
  id: OnboardingGoalChoice;
  label: string;
  accent: string;
  Icon: PhosphorIcon;
}> = [
  { id: 'save', label: 'Save for a goal', accent: '#F7A54D', Icon: PiggyBank },
  { id: 'track', label: 'Track my spending', accent: '#707BFF', Icon: ChartBar },
  { id: 'debt', label: 'Pay off debt', accent: '#EF4444', Icon: CreditCard },
  { id: 'emergency', label: 'Build emergency fund', accent: '#2D7A26', Icon: ShieldCheck },
  { id: 'exploring', label: 'Just exploring', accent: '#8B8D9E', Icon: MagnifyingGlass },
];

export const PRIMARY_GOAL_BY_ID: Record<PrimaryGoalId, PrimaryGoalDefinition> = {
  save: {
    id: 'save',
    label: 'Save for a goal',
    shortLabel: 'Your focus',
    Icon: PiggyBank,
    accentColor: '#F7A54D',
    accentBg: '#FEF5EC',
    progressMode: 'target_amount',
    categoriesSectionTitle: 'Where you can still save',
    emphasizedCategoryIds: ['other', 'groceries', 'utilities'],
  },
  track: {
    id: 'track',
    label: 'Track my spending',
    shortLabel: 'Your focus',
    Icon: ChartBar,
    accentColor: '#707BFF',
    accentBg: '#F0F1FF',
    progressMode: 'categories_tracked',
    categoriesSectionTitle: 'Where your money goes',
    emphasizedCategoryIds: [],
  },
  debt: {
    id: 'debt',
    label: 'Pay off debt',
    shortLabel: 'Your focus',
    Icon: CreditCard,
    accentColor: '#EF4444',
    accentBg: '#FEE2E2',
    progressMode: 'target_amount',
    categoriesSectionTitle: 'Keep essentials covered',
    emphasizedCategoryIds: ['rent', 'utilities', 'transport', 'groceries'],
  },
  emergency: {
    id: 'emergency',
    label: 'Build emergency fund',
    shortLabel: 'Your focus',
    Icon: ShieldCheck,
    accentColor: '#2D7A26',
    accentBg: '#EEFAEC',
    progressMode: 'target_amount',
    categoriesSectionTitle: 'Building your safety net',
    emphasizedCategoryIds: ['other', 'utilities', 'rent'],
  },
};

const LEGACY_GOAL_MAP: Record<string, PrimaryGoalId> = {
  save: 'save',
  track: 'track',
  debt: 'debt',
  emergency: 'emergency',
  invest: 'track',
  exploring: 'track',
};

export function resolveOnboardingGoalChoice(choice: OnboardingGoalChoice | null | undefined): PrimaryGoalId {
  if (!choice) return 'track';
  if (choice === 'exploring') return 'track';
  return choice;
}

export function parsePrimaryGoal(raw: string | null | undefined): PrimaryGoalId {
  if (raw && raw in LEGACY_GOAL_MAP) return LEGACY_GOAL_MAP[raw];
  return 'track';
}

export function getPrimaryGoalDefinition(goalId: PrimaryGoalId | null | undefined): PrimaryGoalDefinition {
  return PRIMARY_GOAL_BY_ID[parsePrimaryGoal(goalId ?? undefined)];
}

export const GOAL_ONBOARDING_ALLOCATION_WEIGHTS: Record<PrimaryGoalId, Record<string, number>> = {
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
};

export const DISCRETIONARY_CATEGORY_IDS = ['entertainment', 'shopping', 'dining'] as const;

export interface CategoryLike {
  id: string;
  name: string;
}

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

export function getGoalTargetFieldCopy(goalId: PrimaryGoalId): {
  nameLabel: string;
  namePlaceholder: string;
  amountLabel: string;
  dateLabel: string;
  currentLabel: string;
} {
  switch (goalId) {
    case 'debt':
      return {
        nameLabel: 'What are you paying off?',
        namePlaceholder: 'e.g. Credit cards',
        amountLabel: 'Total to pay off',
        dateLabel: 'Pay off by',
        currentLabel: 'Already paid',
      };
    case 'emergency':
      return {
        nameLabel: 'Fund name',
        namePlaceholder: 'e.g. Emergency fund',
        amountLabel: 'Target fund size',
        dateLabel: 'Build by',
        currentLabel: 'Already saved',
      };
    case 'save':
    default:
      return {
        nameLabel: 'What are you saving for?',
        namePlaceholder: 'e.g. New car, trip',
        amountLabel: 'Target amount',
        dateLabel: 'Save by',
        currentLabel: 'Already saved',
      };
  }
}
