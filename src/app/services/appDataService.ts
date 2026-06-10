import type {
  AppState,
  Action,
  Expense,
  CategoryCustomization,
  CustomCategory,
  PrimaryGoalId,
  SavingsGoal,
} from '../data/types';
import { parsePrimaryGoal } from '../data/primaryGoalConfig';
import { isFocusCategoryId, syncPrimaryGoalTargetFromExpenses } from '../data/focusCategory';
import { goalRequiresTargetSetup, targetFromProfileFields, targetToProfileFields } from '../data/primaryGoalTarget';
import { updateProfileSafe } from './profileUpdates';
import { fetchOnboarding } from './onboardingService';
import type {
  DbProfile,
  DbExpense,
  DbSavingsGoal,
  DbCategoryCustomization,
  DbCustomCategory,
  DbUserPreferences,
} from '../data/database.types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../data/notificationPreferences';
import { resolveAppearanceMode } from '../theme/appColors';
import { getSupabase } from '../../lib/supabase';
import { toCustomCategoryAppId, toCustomCategoryDbId } from '../utils/customCategoryId';
import { recurringSeriesKey } from '../utils/recurringExpense';
import type { NotificationPreferences } from '../data/types';

function isMissingPrefsColumnError(error: { code?: string; message?: string }, column: string): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST204' ||
    msg.includes(column.toLowerCase()) ||
    msg.includes('schema cache')
  );
}

function isMissingTableError(error: { code?: string; message?: string }, table: string): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  const tableLower = table.toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    msg.includes(tableLower) ||
    (msg.includes('does not exist') && msg.includes('relation'))
  );
}

async function replaceSavingsGoalsOnServer(userId: string, goals: SavingsGoal[]): Promise<void> {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase.from('savings_goals').delete().eq('user_id', userId);
  if (deleteError && !isMissingTableError(deleteError, 'savings_goals')) throw deleteError;
  if (deleteError) return;

  if (goals.length === 0) return;
  const { error: insertError } = await supabase.from('savings_goals').insert(
    goals.map((g, index) => savingsGoalToRow(userId, g, index)),
  );
  if (insertError && !isMissingTableError(insertError, 'savings_goals')) throw insertError;
}

/** Upsert notification prefs; omits disabled_category_ids if the column is not migrated yet. */
async function upsertUserPreferencesFromState(
  userId: string,
  state: AppState,
): Promise<void> {
  const supabase = getSupabase();
  const base = {
    user_id: userId,
    ...notificationPreferencesToDb(state.notificationPreferences),
  };
  const withDisabled = {
    ...base,
    disabled_category_ids: state.disabledCategoryIds ?? [],
  };

  let result = await supabase
    .from('user_preferences')
    .upsert(withDisabled, { onConflict: 'user_id' });

  if (result.error && isMissingPrefsColumnError(result.error, 'disabled_category_ids')) {
    result = await supabase.from('user_preferences').upsert(base, { onConflict: 'user_id' });
  }

  if (result.error) throw result.error;
}

function rowToCustomCategory(row: DbCustomCategory): CustomCategory {
  return {
    id: toCustomCategoryAppId(row.id),
    name: row.name,
    color: row.color,
    bg: row.bg,
    iconKey: row.icon_key,
    iconColor: row.icon_color ?? undefined,
  };
}

function rowToSavingsGoal(row: DbSavingsGoal): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: row.target_date ?? '',
    iconKey: row.icon_key as SavingsGoal['iconKey'],
    accentColor: row.accent_color,
    accentBg: row.accent_bg,
  };
}

function savingsGoalToRow(userId: string, goal: SavingsGoal, sortOrder: number) {
  return {
    id: goal.id,
    user_id: userId,
    name: goal.name,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    target_date: goal.targetDate || null,
    icon_key: goal.iconKey,
    accent_color: goal.accentColor,
    accent_bg: goal.accentBg,
    sort_order: sortOrder,
  };
}

function customCategoryToRow(userId: string, c: CustomCategory) {
  return {
    id: toCustomCategoryDbId(c.id),
    user_id: userId,
    name: c.name,
    color: c.color,
    bg: c.bg,
    icon_key: c.iconKey,
    icon_color: c.iconColor ?? null,
  };
}

/** Clears financial data; keeps profile, currency, appearance, and notification prefs. */
export function buildErasedAppState(current: AppState): AppState {
  return createEmptyAppState({
    userName: current.userName,
    userFullName: current.userFullName,
    userEmail: current.userEmail,
    userPhone: current.userPhone,
    userAvatar: current.userAvatar,
    currency: current.currency,
    appearance: current.appearance,
    notificationPreferences: current.notificationPreferences,
  });
}

export async function eraseAllAppDataOnServer(
  userId: string,
  current: AppState,
): Promise<AppState> {
  const wiped = buildErasedAppState(current);
  await replaceAppStateOnServer(userId, wiped);
  return wiped;
}

export function createEmptyAppState(overrides?: Partial<AppState>): AppState {
  return {
    expenses: [],
    income: 0,
    monthlyBudget: 0,
    budgetGoals: [],
    currency: 'EUR',
    userName: '',
    userFullName: '',
    userEmail: '',
    userPhone: '',
    userAvatar: '',
    categoryCustomizations: {},
    disabledCategoryIds: [],
    customCategories: [],
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    primaryGoal: null,
    primaryGoalTarget: null,
    savingsGoals: [],
    ...overrides,
    appearance: resolveAppearanceMode(overrides?.appearance),
  };
}

export function dbPrefsToNotificationPreferences(
  prefs: DbUserPreferences | null,
): NotificationPreferences {
  if (!prefs) return DEFAULT_NOTIFICATION_PREFERENCES;
  return {
    budgetAlerts: prefs.budget_alerts,
    weeklySummary: prefs.weekly_summary,
    billReminders: prefs.bill_reminders,
    goalMilestones: prefs.goal_milestones,
    recurringReminders: prefs.recurring_reminders,
  };
}

export function notificationPreferencesToDb(
  prefs: NotificationPreferences,
): Omit<DbUserPreferences, 'user_id'> {
  return {
    budget_alerts: prefs.budgetAlerts,
    weekly_summary: prefs.weeklySummary,
    bill_reminders: prefs.billReminders,
    goal_milestones: prefs.goalMilestones,
    recurring_reminders: prefs.recurringReminders,
  };
}

const EMPTY_APP_STATE = createEmptyAppState();

function rowToExpense(row: DbExpense): Expense {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    amount: Number(row.amount),
    date: row.date,
    type: row.type,
    notes: row.notes ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
  };
}

function expenseToRow(userId: string, e: Expense): Omit<DbExpense, 'user_id'> & { user_id: string } {
  return {
    id: e.id,
    user_id: userId,
    name: e.name,
    category_id: e.categoryId,
    amount: e.amount,
    date: e.date,
    type: e.type,
    notes: e.notes ?? null,
    start_date: e.startDate ?? null,
    end_date: e.endDate ?? null,
  };
}

export function profileToAppFields(profile: DbProfile): Pick<
  AppState,
  | 'userName'
  | 'userFullName'
  | 'userEmail'
  | 'userPhone'
  | 'userAvatar'
  | 'currency'
  | 'income'
  | 'monthlyBudget'
  | 'primaryGoal'
  | 'primaryGoalTarget'
> {
  const primaryGoal = profile.primary_goal ? parsePrimaryGoal(profile.primary_goal) : null;
  return {
    userName: profile.display_name || profile.full_name.split(' ')[0] || '',
    userFullName: profile.full_name,
    userEmail: profile.email ?? '',
    userPhone: profile.phone ?? '',
    userAvatar: profile.avatar_url ?? '',
    currency: profile.currency,
    income: Number(profile.income),
    monthlyBudget: Number(profile.monthly_budget),
    primaryGoal,
    primaryGoalTarget: targetFromProfileFields(profile),
  };
}

/** Load full app state for the signed-in user from Postgres. */
export async function fetchAppState(userId: string): Promise<AppState> {
  const supabase = getSupabase();

  const [profileRes, expensesRes, savingsRes, customRes, customCatRes, prefsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('savings_goals').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
    supabase.from('category_customizations').select('*').eq('user_id', userId),
    supabase.from('custom_categories').select('*').eq('user_id', userId),
    supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (savingsRes.error && !isMissingTableError(savingsRes.error, 'savings_goals')) {
    throw savingsRes.error;
  }
  if (customRes.error) throw customRes.error;
  if (customCatRes.error) throw customCatRes.error;
  if (prefsRes.error && prefsRes.error.code !== 'PGRST116') throw prefsRes.error;

  const profile = profileRes.data as DbProfile;
  const categoryCustomizations: Record<string, CategoryCustomization> = {};
  for (const row of (customRes.data ?? []) as DbCategoryCustomization[]) {
    categoryCustomizations[row.category_id] = {
      name: row.name ?? undefined,
      iconKey: row.icon_key ?? undefined,
      color: row.color ?? undefined,
      bg: row.bg ?? undefined,
      iconColor: row.icon_color ?? undefined,
    };
  }

  const customCategories: CustomCategory[] = ((customCatRes.data ?? []) as DbCustomCategory[]).map(
    rowToCustomCategory,
  );

  const base = {
    ...EMPTY_APP_STATE,
    ...profileToAppFields(profile),
    expenses: ((expensesRes.data ?? []) as DbExpense[]).map(rowToExpense),
    budgetGoals: [],
    savingsGoals: savingsRes.error
      ? []
      : ((savingsRes.data ?? []) as DbSavingsGoal[]).map(rowToSavingsGoal),
    categoryCustomizations,
    disabledCategoryIds: (prefsRes.data as DbUserPreferences | null)?.disabled_category_ids ?? [],
    customCategories,
    notificationPreferences: dbPrefsToNotificationPreferences(
      prefsRes.data as DbUserPreferences | null,
    ),
  };

  try {
    const onboarding = await fetchOnboarding(userId);
    if (base.savingsGoals.length === 0 && onboarding?.data?.savingsGoals?.length) {
      base.savingsGoals = onboarding.data.savingsGoals;
    }
  } catch {
    // onboarding_progress may be unavailable; ignore
  }

  return syncPrimaryGoalTargetFromExpenses(base);
}

async function syncPrimaryGoalProfileIfNeeded(userId: string, state: AppState): Promise<void> {
  if (!state.primaryGoalTarget || !state.primaryGoal) return;
  const fields = targetToProfileFields(state.primaryGoalTarget, state.primaryGoal);
  await updateProfileSafe(userId, fields);
}

/** Persist a single reducer action to Supabase (no-op if offline config). */
export async function syncActionToSupabase(
  userId: string,
  action: Action,
  state: AppState,
): Promise<void> {
  const supabase = getSupabase();

  switch (action.type) {
    case 'ADD_EXPENSE': {
      const row = expenseToRow(userId, action.expense);
      const { error } = await supabase.from('expenses').upsert(row);
      if (error) throw error;
      await syncPrimaryGoalProfileIfNeeded(userId, state);
      break;
    }
    case 'ADD_EXPENSES': {
      if (action.expenses.length > 0) {
        const rows = action.expenses.map(e => expenseToRow(userId, e));
        const { error } = await supabase.from('expenses').upsert(rows);
        if (error) throw error;
      }
      await syncPrimaryGoalProfileIfNeeded(userId, state);
      break;
    }
    case 'UPDATE_EXPENSE': {
      const seriesKey =
        action.expense.type === 'one-time'
          ? null
          : recurringSeriesKey(action.expense);
      const rows = (seriesKey
        ? state.expenses.filter(
            e => e.type !== 'one-time' && recurringSeriesKey(e) === seriesKey,
          )
        : [action.expense]
      ).map(e => expenseToRow(userId, e));
      if (rows.length > 0) {
        const { error } = await supabase.from('expenses').upsert(rows);
        if (error) throw error;
      }
      await syncPrimaryGoalProfileIfNeeded(userId, state);
      break;
    }
    case 'DELETE_EXPENSE': {
      const { error } = await supabase.from('expenses').delete().eq('id', action.id).eq('user_id', userId);
      if (error) throw error;
      await syncPrimaryGoalProfileIfNeeded(userId, state);
      break;
    }
    case 'DELETE_EXPENSES': {
      const { error } = await supabase.from('expenses').delete().in('id', action.ids).eq('user_id', userId);
      if (error) throw error;
      await syncPrimaryGoalProfileIfNeeded(userId, state);
      break;
    }
    case 'SET_INCOME': {
      const { error } = await supabase.from('profiles').update({ income: action.amount }).eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_BUDGET': {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ monthly_budget: action.amount })
        .eq('id', userId);
      if (profileErr) throw profileErr;
      break;
    }
    case 'SET_CATEGORY_BUDGET':
      break;
    case 'SET_CURRENCY': {
      const { error } = await supabase.from('profiles').update({ currency: action.currency }).eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_USER_NAME': {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: action.name })
        .eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_USER_FULL_NAME': {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: action.fullName, display_name: action.fullName.split(' ')[0] || action.fullName })
        .eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_USER_EMAIL': {
      const { error } = await supabase.from('profiles').update({ email: action.email }).eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_USER_PHONE': {
      const { error } = await supabase.from('profiles').update({ phone: action.phone }).eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_USER_AVATAR': {
      const isUrl = action.avatar.startsWith('http');
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: isUrl ? action.avatar : null })
        .eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_CATEGORY_CUSTOMIZATION': {
      const c = action.customization;
      const { error } = await supabase.from('category_customizations').upsert({
        user_id: userId,
        category_id: action.categoryId,
        name: c.name ?? null,
        icon_key: c.iconKey ?? null,
        color: c.color ?? null,
        bg: c.bg ?? null,
        icon_color: c.iconColor ?? null,
      });
      if (error) throw error;
      break;
    }
    case 'ADD_CUSTOM_CATEGORY': {
      const { error } = await supabase
        .from('custom_categories')
        .upsert(customCategoryToRow(userId, action.category));
      if (error) throw error;
      break;
    }
    case 'UPDATE_CUSTOM_CATEGORY': {
      const { error } = await supabase
        .from('custom_categories')
        .upsert(customCategoryToRow(userId, action.category));
      if (error) throw error;
      break;
    }
    case 'SET_NOTIFICATION_PREFERENCES': {
      const { error } = await supabase
        .from('user_preferences')
        .update(notificationPreferencesToDb(action.preferences))
        .eq('user_id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_DISABLED_CATEGORY_IDS': {
      const { error } = await supabase
        .from('user_preferences')
        .update({ disabled_category_ids: action.categoryIds })
        .eq('user_id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_FOCUS_GOAL_PROGRESS': {
      const expense = state.expenses[0];
      if (expense && isFocusCategoryId(expense.categoryId)) {
        const { error } = await supabase.from('expenses').upsert(expenseToRow(userId, expense));
        if (error) throw error;
      }
      const targetFields = targetToProfileFields(state.primaryGoalTarget, state.primaryGoal);
      await updateProfileSafe(userId, targetFields);
      break;
    }
    case 'SET_PRIMARY_GOAL': {
      const targetFields = targetToProfileFields(action.target ?? null, action.goal);
      await updateProfileSafe(userId, { primary_goal: action.goal, ...targetFields });
      const expense = state.expenses[0];
      if (
        expense &&
        isFocusCategoryId(expense.categoryId) &&
        goalRequiresTargetSetup(action.goal)
      ) {
        const { error } = await supabase.from('expenses').upsert(expenseToRow(userId, expense));
        if (error) throw error;
      }
      break;
    }
    case 'ADD_SAVINGS_GOAL': {
      const sortOrder = state.savingsGoals.findIndex(g => g.id === action.goal.id);
      const { error } = await supabase
        .from('savings_goals')
        .insert(savingsGoalToRow(userId, action.goal, sortOrder >= 0 ? sortOrder : state.savingsGoals.length - 1));
      if (error && !isMissingTableError(error, 'savings_goals')) throw error;
      break;
    }
    case 'UPDATE_SAVINGS_GOAL': {
      const sortOrder = state.savingsGoals.findIndex(g => g.id === action.goal.id);
      const { error } = await supabase.from('savings_goals').upsert(
        savingsGoalToRow(userId, action.goal, sortOrder >= 0 ? sortOrder : 0),
      );
      if (error && !isMissingTableError(error, 'savings_goals')) throw error;
      break;
    }
    case 'DELETE_SAVINGS_GOAL': {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('user_id', userId)
        .eq('id', action.id);
      if (error && !isMissingTableError(error, 'savings_goals')) throw error;
      break;
    }
    case 'HYDRATE_STATE':
    case 'RESET_STATE':
      break;
    default:
      break;
  }
}

/** Replace all user rows from a full AppState (migration / onboarding complete). */
export async function replaceAppStateOnServer(userId: string, state: AppState): Promise<void> {
  const supabase = getSupabase();

  const targetFields = targetToProfileFields(state.primaryGoalTarget, state.primaryGoal);
  await updateProfileSafe(userId, {
    full_name: state.userFullName,
    display_name: state.userName,
    email: state.userEmail,
    phone: state.userPhone,
    avatar_url: state.userAvatar.startsWith('http') ? state.userAvatar : null,
    currency: state.currency,
    income: state.income,
    monthly_budget: state.monthlyBudget,
    primary_goal: state.primaryGoal,
    has_migrated: true,
    ...targetFields,
  });

  await supabase.from('expenses').delete().eq('user_id', userId);
  if (state.expenses.length > 0) {
    const rows = state.expenses.map(e => expenseToRow(userId, e));
    const { error } = await supabase.from('expenses').insert(rows);
    if (error) throw error;
  }

  await replaceSavingsGoalsOnServer(userId, state.savingsGoals);

  await supabase.from('category_customizations').delete().eq('user_id', userId);
  const customEntries = Object.entries(state.categoryCustomizations);
  if (customEntries.length > 0) {
    const { error } = await supabase.from('category_customizations').insert(
      customEntries.map(([categoryId, c]) => ({
        user_id: userId,
        category_id: categoryId,
        name: c.name ?? null,
        icon_key: c.iconKey ?? null,
        color: c.color ?? null,
        bg: c.bg ?? null,
        icon_color: c.iconColor ?? null,
      })),
    );
    if (error) throw error;
  }

  await supabase.from('custom_categories').delete().eq('user_id', userId);
  if (state.customCategories.length > 0) {
    const { error } = await supabase
      .from('custom_categories')
      .insert(state.customCategories.map(c => customCategoryToRow(userId, c)));
    if (error) throw error;
  }

  await upsertUserPreferencesFromState(userId, state);
}

export async function fetchUserPreferences(userId: string): Promise<DbUserPreferences | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as DbUserPreferences | null;
}

export async function updateUserPreferences(
  userId: string,
  prefs: Partial<Omit<DbUserPreferences, 'user_id'>>,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('user_preferences').update(prefs).eq('user_id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: Blob, ext: string): Promise<string> {
  const supabase = getSupabase();
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = data.publicUrl;
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (error) throw error;
  return url;
}
