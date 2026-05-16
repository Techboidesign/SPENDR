import { createContext, useCallback, useContext, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { motion } from 'motion/react';

/* ── Nav context ── lets any sub-page trigger the exit slide-out ── */
interface SubPageNavCtx { exit: (path: string) => void }
const SubPageNavContext = createContext<SubPageNavCtx>({ exit: () => {} });
export const useSubPageNav = () => useContext(SubPageNavContext);

/* ── Shared status bar (mirrors RootLayout) ── */
const StatusBar = () => (
  <div style={{
    height: 50, backgroundColor: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 28px 0', flexShrink: 0, zIndex: 10, position: 'relative',
  }}>
    <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', letterSpacing: -0.3 }}>9:41</span>
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      width: 120, height: 34, backgroundColor: '#1A1A2E', borderRadius: 20, zIndex: 1,
    }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
        <rect x="0" y="7" width="3" height="5" rx="0.5" fill="#1A1A2E" />
        <rect x="4.5" y="4.5" width="3" height="7.5" rx="0.5" fill="#1A1A2E" />
        <rect x="9" y="2" width="3" height="10" rx="0.5" fill="#1A1A2E" />
        <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#1A1A2E" opacity="0.35" />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <path d="M8 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#1A1A2E" />
        <path d="M4.93 7.07A5 5 0 0 1 11.07 7.07" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2.1 4.24A8.5 8.5 0 0 1 13.9 4.24" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0 1.5A11.5 11.5 0 0 1 16 1.5" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <div style={{ width: 25, height: 12, border: '1.5px solid #1A1A2E', borderRadius: 3, padding: 1.5, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '80%', height: '100%', backgroundColor: '#1A1A2E', borderRadius: 1 }} />
        </div>
        <div style={{ width: 2, height: 5, backgroundColor: '#1A1A2E', borderRadius: 1, opacity: 0.5 }} />
      </div>
    </div>
  </div>
);

/* ── Layout ── */
export default function SubPageLayout() {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [exitTarget, setExitTarget] = useState('/settings');

  const exit = useCallback((path: string) => {
    setExitTarget(path);
    setExiting(true);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: 390, height: 844,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
      borderRadius: 48,
    }}>
      <StatusBar />

      {/* Content area with slide animation */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <SubPageNavContext.Provider value={{ exit }}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: exiting ? '100%' : 0 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 36,
              mass: 0.85,
            }}
            onAnimationComplete={() => {
              if (exiting) navigate(exitTarget);
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Outlet />
          </motion.div>
        </SubPageNavContext.Provider>
      </div>
    </div>
  );
}
