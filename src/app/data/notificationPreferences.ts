import type { AppState, NotificationPreferences } from './types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  budgetAlerts: true,
  weeklySummary: true,
  billReminders: true,
  goalMilestones: true,
  recurringReminders: true,
};

export function mergeNotificationPreferences(
  partial?: Partial<NotificationPreferences>,
): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...partial };
}

/** Ensures legacy / partial persisted state has notification prefs. */
export function normalizeAppState(state: AppState): AppState {
  return {
    ...state,
    appearance: state.appearance === 'dark' ? 'dark' : 'light',
    notificationPreferences: mergeNotificationPreferences(state.notificationPreferences),
    disabledCategoryIds: state.disabledCategoryIds ?? [],
    primaryGoal: state.primaryGoal ?? null,
  };
}
