import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  APPEARANCE_STORAGE_KEY,
  APP_COLORS,
  readStoredAppearance,
  type AppearanceMode,
  type AppColorPalette,
} from '../theme/appColors';
import type { Action, AppState } from '../data/types';
import { setItem } from '../utils/storage';

interface AppearanceContextValue {
  mode: AppearanceMode;
  isDark: boolean;
  colors: AppColorPalette;
  setAppearance: (mode: AppearanceMode) => void;
  toggleAppearance: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/** Wired inside AppProvider — must not import AppContext (avoids circular modules). */
export function AppearanceProviderInner({
  state,
  dispatch,
  children,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  children: ReactNode;
}) {
  const mode = state.appearance;
  const isDark = mode === 'dark';
  const colors = APP_COLORS[mode];

  useEffect(() => {
    const stored = readStoredAppearance();
    if (stored && stored !== state.appearance) {
      dispatch({ type: 'SET_APPEARANCE', mode: stored });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    setItem(APPEARANCE_STORAGE_KEY, mode);
  }, [isDark, mode]);

  const setAppearance = useCallback(
    (next: AppearanceMode) => {
      dispatch({ type: 'SET_APPEARANCE', mode: next });
    },
    [dispatch],
  );

  const toggleAppearance = useCallback(() => {
    dispatch({ type: 'SET_APPEARANCE', mode: isDark ? 'light' : 'dark' });
  }, [dispatch, isDark]);

  const value = useMemo(
    () => ({ mode, isDark, colors, setAppearance, toggleAppearance }),
    [mode, isDark, colors, setAppearance, toggleAppearance],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return ctx;
}

/** Shorthand for themed palette in screens and components. */
export function useAppColors(): AppColorPalette {
  return useAppearance().colors;
}
