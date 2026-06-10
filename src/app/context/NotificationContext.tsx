import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { NotificationBanner } from '../components/ui/NotificationBanner';
import { useNavigate } from 'react-router';
import {
  markNotificationSeen,
  type NotificationAlertPayload,
} from '../services/notificationAlerts';
import { useApp } from './AppContext';

type QueuedNotification = NotificationAlertPayload;

interface NotificationContextValue {
  active: QueuedNotification | null;
  showNotification: (payload: NotificationAlertPayload) => void;
  dismissNotification: () => void;
  /** Drop queued banners (e.g. before showing a new auto alert). */
  clearNotificationQueue: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<QueuedNotification | null>(null);
  const queueRef = useRef<QueuedNotification[]>([]);
  const showingRef = useRef(false);

  const pumpQueue = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setActive(null);
      return;
    }
    showingRef.current = true;
    setActive(next);
  }, []);

  const clearNotificationQueue = useCallback(() => {
    queueRef.current = [];
  }, []);

  const dismissNotification = useCallback(() => {
    if (active) {
      markNotificationSeen(active.id);
    }
    showingRef.current = false;
    setActive(null);
    window.setTimeout(pumpQueue, 280);
  }, [active, pumpQueue]);

  const showNotification = useCallback(
    (payload: NotificationAlertPayload) => {
      const exists =
        active?.id === payload.id ||
        queueRef.current.some(item => item.id === payload.id);
      if (exists) return;

      if (!showingRef.current && !active) {
        showingRef.current = true;
        setActive(payload);
        return;
      }

      queueRef.current = [payload];
    },
    [active],
  );

  const value = useMemo(
    () => ({ active, showNotification, dismissNotification, clearNotificationQueue }),
    [active, showNotification, dismissNotification, clearNotificationQueue],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/** Renders inside DeviceShell so banners stay within the phone mockup. */
export function NotificationBannerHost() {
  const { active, dismissNotification } = useNotifications();
  const navigate = useNavigate();
  const { requestExpenseFocus } = useApp();

  if (!active) return null;

  const onPress =
    active.action?.type === 'view-expense'
      ? () => {
          requestExpenseFocus(active.action!.expenseId, active.action!.monthKey);
          navigate('/expenses');
          dismissNotification();
        }
      : undefined;

  return (
    <div
      role="presentation"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 280,
        padding: 0,
        margin: 0,
        pointerEvents: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <NotificationBanner
        key={active.id}
        title={active.title}
        message={active.message}
        variant={active.variant}
        onDismiss={dismissNotification}
        onPress={onPress}
      />
    </div>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
