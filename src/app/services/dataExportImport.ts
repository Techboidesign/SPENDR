import type {
  AppState,
  CategoryCustomization,
  CustomCategory,
  Expense,
  SavingsGoal,
} from '../data/types';
import { generateId } from '../utils/id';

export const DATA_EXPORT_VERSION = 1 as const;

/** Portable backup — expenses, budget, income, savings goals, and category setup. */
export interface SpendrDataExport {
  version: typeof DATA_EXPORT_VERSION;
  exportedAt: string;
  income: number;
  monthlyBudget: number;
  savingsGoals: SavingsGoal[];
  categoryCustomizations: Record<string, CategoryCustomization>;
  customCategories: CustomCategory[];
  disabledCategoryIds: string[];
  expenses: Expense[];
}

export type ImportMode = 'merge' | 'overwrite';

export interface DataCounts {
  expenses: number;
  savingsGoals: number;
  customCategories: number;
  customizations: number;
  income: number;
  monthlyBudget: number;
}

export function buildDataExport(state: AppState): SpendrDataExport {
  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    income: state.income,
    monthlyBudget: state.monthlyBudget,
    savingsGoals: state.savingsGoals,
    categoryCustomizations: { ...state.categoryCustomizations },
    customCategories: state.customCategories.map(c => ({ ...c })),
    disabledCategoryIds: [...state.disabledCategoryIds],
    expenses: state.expenses.map(e => ({ ...e })),
  };
}

export function getDataCounts(data: Partial<SpendrDataExport>): DataCounts {
  return {
    expenses: data.expenses?.length ?? 0,
    savingsGoals: data.savingsGoals?.length ?? 0,
    customCategories: data.customCategories?.length ?? 0,
    customizations: Object.keys(data.categoryCustomizations ?? {}).length,
    income: data.income ?? 0,
    monthlyBudget: data.monthlyBudget ?? 0,
  };
}

export function stateHasUserData(state: AppState): boolean {
  return (
    state.expenses.length > 0 ||
    state.savingsGoals.length > 0 ||
    state.income > 0 ||
    state.monthlyBudget > 0 ||
    state.customCategories.length > 0 ||
    Object.keys(state.categoryCustomizations).length > 0 ||
    state.disabledCategoryIds.length > 0
  );
}

export function shouldPromptImportMode(current: AppState, imported: SpendrDataExport): boolean {
  return stateHasUserData(current) && importHasContent(imported);
}

function importHasContent(data: SpendrDataExport): boolean {
  const counts = getDataCounts(data);
  return (
    counts.expenses > 0 ||
    counts.savingsGoals > 0 ||
    counts.customCategories > 0 ||
    counts.customizations > 0 ||
    counts.income > 0 ||
    counts.monthlyBudget > 0 ||
    data.disabledCategoryIds.length > 0
  );
}

export function downloadDataExport(state: AppState): void {
  const payload = buildDataExport(state);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `spendr-backup-${new Date().toISOString().slice(0, 10)}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function applyImport(
  current: AppState,
  imported: SpendrDataExport,
  mode: ImportMode,
): AppState {
  if (mode === 'overwrite') {
    return {
      ...current,
      expenses: imported.expenses.map(e => ({ ...e })),
      income: imported.income,
      monthlyBudget: imported.monthlyBudget,
      savingsGoals: imported.savingsGoals.map(g => ({ ...g })),
      categoryCustomizations: { ...imported.categoryCustomizations },
      customCategories: imported.customCategories.map(c => ({ ...c })),
      disabledCategoryIds: [...imported.disabledCategoryIds],
    };
  }

  const existingExpenseIds = new Set(current.expenses.map(e => e.id));
  const mergedExpenses = [
    ...current.expenses,
    ...imported.expenses.map(e =>
      existingExpenseIds.has(e.id) ? { ...e, id: generateId() } : { ...e },
    ),
  ];

  const customById = new Map(current.customCategories.map(c => [c.id, c]));
  for (const cat of imported.customCategories) {
    customById.set(cat.id, { ...cat });
  }

  const goalsById = new Map(current.savingsGoals.map(g => [g.id, g]));
  for (const goal of imported.savingsGoals) {
    goalsById.set(goal.id, { ...goal });
  }

  return {
    ...current,
    expenses: mergedExpenses,
    savingsGoals: [...goalsById.values()],
    categoryCustomizations: {
      ...current.categoryCustomizations,
      ...imported.categoryCustomizations,
    },
    customCategories: [...customById.values()],
    disabledCategoryIds: [
      ...new Set([...current.disabledCategoryIds, ...imported.disabledCategoryIds]),
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseExpenseRow(raw: unknown): Expense | null {
  if (!isRecord(raw)) return null;
  const { id, name, categoryId, amount, date, type } = raw;
  if (
    typeof name !== 'string' ||
    typeof categoryId !== 'string' ||
    typeof amount !== 'number' ||
    typeof date !== 'string' ||
    (type !== 'one-time' && type !== 'monthly' && type !== 'yearly')
  ) {
    return null;
  }
  return {
    id: typeof id === 'string' ? id : generateId(),
    name,
    categoryId,
    amount,
    date,
    type,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : undefined,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : undefined,
  };
}

function parseSavingsGoal(raw: unknown): SavingsGoal | null {
  if (!isRecord(raw)) return null;
  const {
    id,
    name,
    targetAmount,
    currentAmount,
    targetDate,
    iconKey,
    accentColor,
    accentBg,
  } = raw;
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof targetAmount !== 'number' ||
    typeof currentAmount !== 'number' ||
    typeof targetDate !== 'string' ||
    typeof iconKey !== 'string' ||
    typeof accentColor !== 'string' ||
    typeof accentBg !== 'string'
  ) {
    return null;
  }
  return {
    id,
    name,
    targetAmount,
    currentAmount,
    targetDate,
    iconKey: iconKey as SavingsGoal['iconKey'],
    accentColor,
    accentBg,
  };
}

function parseCustomCategory(raw: unknown): CustomCategory | null {
  if (!isRecord(raw)) return null;
  const { id, name, color, bg, iconKey } = raw;
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof color !== 'string' ||
    typeof bg !== 'string' ||
    typeof iconKey !== 'string'
  ) {
    return null;
  }
  return {
    id,
    name,
    color,
    bg,
    iconKey,
    iconColor: typeof raw.iconColor === 'string' ? raw.iconColor : undefined,
  };
}

function parseCategoryCustomization(raw: unknown): CategoryCustomization | null {
  if (!isRecord(raw)) return null;
  const customization: CategoryCustomization = {};
  if (typeof raw.name === 'string') customization.name = raw.name;
  if (typeof raw.iconKey === 'string') customization.iconKey = raw.iconKey;
  if (typeof raw.color === 'string') customization.color = raw.color;
  if (typeof raw.bg === 'string') customization.bg = raw.bg;
  if (typeof raw.iconColor === 'string') customization.iconColor = raw.iconColor;
  return Object.keys(customization).length > 0 ? customization : null;
}

export function parseDataExportJson(text: string): SpendrDataExport {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || parsed.version !== DATA_EXPORT_VERSION) {
    throw new Error('Unsupported or missing backup version');
  }

  const expenses = Array.isArray(parsed.expenses)
    ? parsed.expenses.map(parseExpenseRow).filter((e): e is Expense => e !== null)
    : [];

  const savingsGoals = Array.isArray(parsed.savingsGoals)
    ? parsed.savingsGoals.map(parseSavingsGoal).filter((g): g is SavingsGoal => g !== null)
    : [];

  const customCategories = Array.isArray(parsed.customCategories)
    ? parsed.customCategories.map(parseCustomCategory).filter((c): c is CustomCategory => c !== null)
    : [];

  const categoryCustomizations: Record<string, CategoryCustomization> = {};
  if (isRecord(parsed.categoryCustomizations)) {
    for (const [categoryId, value] of Object.entries(parsed.categoryCustomizations)) {
      const customization = parseCategoryCustomization(value);
      if (customization) categoryCustomizations[categoryId] = customization;
    }
  }

  const disabledCategoryIds = Array.isArray(parsed.disabledCategoryIds)
    ? parsed.disabledCategoryIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    income: typeof parsed.income === 'number' ? parsed.income : 0,
    monthlyBudget: typeof parsed.monthlyBudget === 'number' ? parsed.monthlyBudget : 0,
    savingsGoals,
    categoryCustomizations,
    customCategories,
    disabledCategoryIds,
    expenses,
  };
}

/** Legacy expense-only CSV import. */
export function parseExpenseCsv(
  csv: string,
  resolveCategoryId: (name: string) => string | null,
): SpendrDataExport {
  const lines = csv.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1);
  const expenses: Expense[] = [];

  for (const line of dataLines) {
    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 5) continue;

    const [date, name, amount, category, type] = matches.map(m =>
      m.replace(/^"|"$/g, '').trim(),
    );

    const categoryId = resolveCategoryId(category);
    if (!categoryId) continue;

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) continue;
    if (!['one-time', 'monthly', 'yearly'].includes(type)) continue;

    expenses.push({
      id: generateId(),
      name,
      amount: parsedAmount,
      categoryId,
      date,
      type: type as Expense['type'],
    });
  }

  if (expenses.length === 0 && dataLines.length > 0) {
    throw new Error('No valid expense rows found');
  }

  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    income: 0,
    monthlyBudget: 0,
    savingsGoals: [],
    categoryCustomizations: {},
    customCategories: [],
    disabledCategoryIds: [],
    expenses,
  };
}

export function parseImportFile(
  text: string,
  fileName: string,
  resolveCategoryId: (name: string) => string | null,
): SpendrDataExport {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return parseDataExportJson(trimmed);
  }
  if (fileName.toLowerCase().endsWith('.json')) {
    return parseDataExportJson(trimmed);
  }
  return parseExpenseCsv(trimmed, resolveCategoryId);
}
