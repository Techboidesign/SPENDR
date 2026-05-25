import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { BottomTabBar } from './BottomTabBar';
import DeviceShell from './DeviceShell';
import SettingsScreen from './screens/SettingsScreen';
import { useAppColors } from '../context/AppearanceContext';
import { MODAL_HOST_ID, MODAL_OVERLAY_Z } from './BottomSheetModal';

const SLIDE_EASE = [0.32, 0.72, 0, 1] as const;
const SLIDE_DURATION = 0.32;
const SETTINGS_PATH = '/settings';

interface SubPageNavCtx {
  exit: (path: string) => void;
}
const SubPageNavContext = createContext<SubPageNavCtx>({ exit: () => {} });
export const useSubPageNav = () => useContext(SubPageNavContext);

export default function SubPageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useAppColors();
  const [exiting, setExiting] = useState(false);
  const exitTargetRef = useRef(SETTINGS_PATH);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubPage = location.pathname !== SETTINGS_PATH;

  useEffect(() => {
    setExiting(false);
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, [location.pathname]);

  useEffect(
    () => () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    },
    [],
  );

  const exit = useCallback(
    (path: string) => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      exitTargetRef.current = path;
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        navigate(path);
        exitTimerRef.current = null;
      }, Math.round(SLIDE_DURATION * 1000) + 16);
    },
    [navigate],
  );

  return (
    <DeviceShell
      chrome={
        <>
          <BottomTabBar />
          <div
            id={MODAL_HOST_ID}
            style={{ position: 'absolute', inset: 0, zIndex: MODAL_OVERLAY_Z, pointerEvents: 'none' }}
          />
        </>
      }
    >
      <SubPageNavContext.Provider value={{ exit }}>
        <motion.div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: isSubPage ? 'none' : 'auto',
            }}
            aria-hidden={isSubPage}
          >
            <SettingsScreen />
          </div>

          {isSubPage && (
            <motion.div
              key={location.pathname}
              initial={{ x: '100%' }}
              animate={{ x: exiting ? '100%' : 0 }}
              transition={{ duration: SLIDE_DURATION, ease: SLIDE_EASE }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                willChange: 'transform',
                backgroundColor: c.canvas,
              }}
            >
              <Outlet />
            </motion.div>
          )}
        </motion.div>
      </SubPageNavContext.Provider>
    </DeviceShell>
  );
}
