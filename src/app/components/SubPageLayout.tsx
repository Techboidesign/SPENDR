import { createContext, useCallback, useContext, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import DeviceShell from './DeviceShell';

interface SubPageNavCtx {
  exit: (path: string) => void;
}
const SubPageNavContext = createContext<SubPageNavCtx>({ exit: () => {} });
export const useSubPageNav = () => useContext(SubPageNavContext);

export default function SubPageLayout() {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [exitTarget, setExitTarget] = useState('/settings');

  const exit = useCallback((path: string) => {
    setExitTarget(path);
    setExiting(true);
  }, []);

  return (
    <DeviceShell>
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
    </DeviceShell>
  );
}
