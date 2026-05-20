import type { AppState, Action, Expense, CategoryCustomization, CustomCategory } from '../data/types';
import type {
  DbProfile,
  DbExpense,
  DbBudgetGoal,
  DbCategoryCustomization,
  DbCustomCategory,
  DbUserPreferences,
} from '../data/database.types';
import { getSupabase } from '../../lib/supabase';

const EMPTY_APP_STATE: AppState = {
  expenses: [],
  income: 0,
  monthlyBudget: 0,
  budgetGoals: [],
  currency: 'EUR',
  userName: '',
  userFullName: '',
  userEmail: '',
  userUsername: '',
  userPhone: '',
  userAvatar: '',
  categoryCustomizations: {},
  customCategories: [],
};

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
  | 'userUsername'
  | 'userPhone'
  | 'userAvatar'
  | 'currency'
  | 'income'
  | 'monthlyBudget'
> {
  return {
    userName: profile.display_name || profile.full_name.split(' ')[0] || '',
    userFullName: profile.full_name,
    userEmail: profile.email ?? '',
    userUsername: profile.username ?? '',
    userPhone: profile.phone ?? '',
    userAvatar: profile.avatar_url ?? '',
    currency: profile.currency,
    income: Number(profile.income),
    monthlyBudget: Number(profile.monthly_budget),
  };
}

/** Load full app state for the signed-in user from Postgres. */
export async function fetchAppState(userId: string): Promise<AppState> {
  const supabase = getSupabase();

  const [profileRes, expensesRes, goalsRes, customRes, customCatRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('budget_goals').select('*').eq('user_id', userId),
    supabase.from('category_customizations').select('*').eq('user_id', userId),
    supabase.from('custom_categories').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (goalsRes.error) throw goalsRes.error;
  if (customRes.error) throw customRes.error;
  if (customCatRes.error) throw customCatRes.error;

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
    row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      bg: row.bg,
      iconKey: row.icon_key,
      iconColor: row.icon_color ?? undefined,
    }),
  );

  return {
    ...EMPTY_APP_STATE,
    ...profileToAppFields(profile),
    expenses: ((expensesRes.data ?? []) as DbExpense[]).map(rowToExpense),
    budgetGoals: ((goalsRes.data ?? []) as DbBudgetGoal[]).map(g => ({
      categoryId: g.category_id,
      amount: Number(g.amount),
    })),
    categoryCustomizations,
    customCategories,
  };
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
      break;
    }
    case 'ADD_EXPENSES': {
      if (action.expenses.length > 0) {
        const rows = action.expenses.map(e => expenseToRow(userId, e));
        const { error } = await supabase.from('expenses').upsert(rows);
        if (error) throw error;
      }
      break;
    }
    case 'UPDATE_EXPENSE': {
      const row = expenseToRow(userId, action.expense);
      const { error } = await supabase.from('expenses').upsert(row);
      if (error) throw error;
      break;
    }
    case 'DELETE_EXPENSE': {
      const { error } = await supabase.from('expenses').delete().eq('id', action.id).eq('user_id', userId);
      if (error) throw error;
      break;
    }
    case 'DELETE_EXPENSES': {
      const { error } = await supabase.from('expenses').delete().in('id', action.ids).eq('user_id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_INCOME': {
      const { error } = await supabase.from('profiles').update({ income: action.amount }).eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_BUDGET': {
      const { error } = await supabase
        .from('profiles')
        .update({ monthly_budget: action.amount })
        .eq('id', userId);
      if (error) throw error;
      break;
    }
    case 'SET_CATEGORY_BUDGET': {
      const { error } = await supabase.from('budget_goals').upsert({
        user_id: userId,
        category_id: action.categoryId,
        amount: action.amount,
      });
      if (error) throw error;
      break;
    }
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
    case 'SET_USER_USERNAME': {
      const { error } = await supabase.from('profiles').update({ username: action.username }).eq('id', userId);
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
      const cat = action.category;
      const { error } = await supabase.from('custom_categories').upsert({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        color: cat.color,
        bg: cat.bg,
        icon_key: cat.iconKey,
        icon_color: cat.iconColor ?? null,
      });
      if (error) throw error;
      break;
    }
    case 'UPDATE_CUSTOM_CATEGORY': {
      const cat = action.category;
      const { error } = await supabase.from('custom_categories').upsert({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        color: cat.color,
        bg: cat.bg,
        icon_key: cat.iconKey,
        icon_color: cat.iconColor ?? null,
      });
      if (error) throw error;
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

  const { error: profileErr } = await supabase.from('profiles').update({
    full_name: state.userFullName,
    display_name: state.userName,
    email: state.userEmail,
    username: state.userUsername,
    phone: state.userPhone,
    avatar_url: state.userAvatar.startsWith('http') ? state.userAvatar : null,
    currency: state.currency,
    income: state.income,
    monthly_budget: state.monthlyBudget,
    has_migrated: true,
  }).eq('id', userId);
  if (profileErr) throw profileErr;

  await supabase.from('expenses').delete().eq('user_id', userId);
  if (state.expenses.length > 0) {
    const rows = state.expenses.map(e => expenseToRow(userId, e));
    const { error } = await supabase.from('expenses').insert(rows);
    if (error) throw error;
  }

  await supabase.from('budget_goals').delete().eq('user_id', userId);
  if (state.budgetGoals.length > 0) {
    const { error } = await supabase.from('budget_goals').insert(
      state.budgetGoals.map(g => ({ user_id: userId, category_id: g.categoryId, amount: g.amount })),
    );
    if (error) throw error;
  }

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
    const { error } = await supabase.from('custom_categories').insert(
      state.customCategories.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        color: c.color,
        bg: c.bg,
        icon_key: c.iconKey,
        icon_color: c.iconColor ?? null,
      })),
    );
    if (error) throw error;
  }
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
