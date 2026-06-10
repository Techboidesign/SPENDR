import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import { useOnboarding } from '../context/OnboardingContext';
import { mergeNotificationPreferences } from '../data/notificationPreferences';
import { evaluateNotificationAlerts } from '../services/notificationAlerts';

/**
 * Evaluates budget / summary / bill / milestone rules and enqueues in-app banners.
 * Mount only under the main app shell (after onboarding).
 */
export function NotificationAlertRunner() {
  const { state, formatCurrency } = useApp();
  const { showNotification, clearNotificationQueue } = useNotifications();
  const { onboarding } = useOnboarding();
  const lastSignatureRef = useRef('');

  useEffect(() => {
    if (onboarding.status === 'in_progress') return;

    const prefs = mergeNotificationPreferences(state.notificationPreferences);

    const signature = JSON.stringify({
      expenses: state.expenses.length,
      budget: state.monthlyBudget,
      savingsGoals: state.savingsGoals,
      prefs,
      month: new Date().toISOString().slice(0, 7),
    });

    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;

    clearNotificationQueue();

    const alert = evaluateNotificationAlerts({
      state,
      prefs,
      formatCurrency,
    });

    if (alert) {
      showNotification(alert);
    }
  }, [
    state,
    state.expenses,
    state.monthlyBudget,
    state.savingsGoals,
    state.notificationPreferences,
    formatCurrency,
    onboarding.status,
    showNotification,
    clearNotificationQueue,
  ]);

  return null;
}
