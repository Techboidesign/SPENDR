import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { House, Receipt, Target, Gear, Plus } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

/** Reserve this at the bottom of scroll areas so content clears the floating bar */
export const TAB_BAR_CLEARANCE = 96;

const FLOAT_BOTTOM = 16;
const FLOAT_SIDES = 8;
const BAR_HEIGHT = 58;
const FAB_SIZE = 68;
const FAB_BORDER = 2;
const ICON_SLOT = 44;
/** Only this fraction of the FAB sits above the bar top edge */
const FAB_PROTRUDE_RATIO = 0.2;
const FAB_CENTER_TOP = Math.max(0, FAB_SIZE * (0.5 - FAB_PROTRUDE_RATIO) - 20) + 10;

const LEFT_TABS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/expenses', label: 'Expenses', Icon: Receipt, end: false },
] as const;

const RIGHT_TABS = [
  { to: '/budget', label: 'Budget', Icon: Target, end: false },
  { to: '/settings', label: 'Settings', Icon: Gear, end: false },
] as const;

type FabPhase = 'idle' | 'tap' | 'close';

const FAB_TRANSITION = {
  tap: { duration: 0.4, ease: [0.22, 1.15, 0.36, 1] as const },
  close: { duration: 0.55, ease: [0.34, 1.4, 0.64, 1] as const },
  idle: { type: 'spring' as const, stiffness: 400, damping: 22 },
};

function fabKeyframes(phase: FabPhase) {
  switch (phase) {
    case 'tap':
      return { scale: [1, 1.12, 1], rotate: [0, 18, 0] };
    case 'close':
      return { scale: [1, 0.9, 1.06, 1], rotate: [0, -14, 8, 0] };
    default:
      return { scale: 1, rotate: 0 };
  }
}

export function BottomTabBar() {
  const { openAddModal, showAddModal } = useApp();
  const [fabPhase, setFabPhase] = useState<FabPhase>('idle');
  const wasModalOpen = useRef(false);

  useEffect(() => {
    if (wasModalOpen.current && !showAddModal) {
      setFabPhase('close');
      const t = window.setTimeout(() => setFabPhase('idle'), 580);
      wasModalOpen.current = showAddModal;
      return () => window.clearTimeout(t);
    }
    wasModalOpen.current = showAddModal;
  }, [showAddModal]);

  const handleFabClick = () => {
    setFabPhase('tap');
    window.setTimeout(() => {
      setFabPhase(prev => (prev === 'tap' ? 'idle' : prev));
    }, 420);
    openAddModal();
  };

  return (
    <>
      <div aria-hidden className="tab-bar-bottom-scrim" />

      <div
        className="tab-bar-float-wrap"
        aria-label="Main navigation"
        style={{
          position: 'absolute',
          left: FLOAT_SIDES,
          right: FLOAT_SIDES,
          bottom: FLOAT_BOTTOM,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
      <nav
        style={{
          position: 'relative',
          height: BAR_HEIGHT,
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          pointerEvents: 'auto',
          isolation: 'isolate',
        }}
      >
        <div
          aria-hidden
          className="tab-bar-glass"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 9999,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: FAB_CENTER_TOP,
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <motion.button
            type="button"
            onClick={handleFabClick}
            aria-label="Add expense"
            initial={false}
            animate={fabKeyframes(fabPhase)}
            transition={FAB_TRANSITION[fabPhase === 'idle' ? 'idle' : fabPhase]}
            style={{
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: '50%',
              backgroundColor: '#3E37FF',
              border: `${FAB_BORDER}px solid rgba(255, 255, 255, 0.95)`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 8px 28px rgba(62, 55, 255, 0.45), 0 2px 8px rgba(15, 23, 42, 0.15)',
              pointerEvents: 'auto',
              padding: 0,
            }}
            whileHover={{
              scale: 1.06,
              backgroundColor: '#524BFF',
              boxShadow: '0 12px 34px rgba(62, 55, 255, 0.52)',
            }}
            whileTap={{
              scale: 0.93,
              backgroundColor: '#342FD9',
              boxShadow: '0 4px 16px rgba(62, 55, 255, 0.35)',
            }}
          >
            <Plus size={30} weight="bold" color="#FFFFFF" />
          </motion.button>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            justifyContent: 'space-evenly',
            minWidth: 0,
          }}
        >
          {LEFT_TABS.map(tab => (
            <TabLink key={tab.to} {...tab} />
          ))}
        </div>

        <div style={{ width: FAB_SIZE + 12, flexShrink: 0, position: 'relative', zIndex: 2 }} aria-hidden />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            justifyContent: 'space-evenly',
            minWidth: 0,
          }}
        >
          {RIGHT_TABS.map(tab => (
            <TabLink key={tab.to} {...tab} />
          ))}
        </div>
      </nav>
      </div>
    </>
  );
}

function TabLink({
  to,
  label,
  Icon,
  end,
}: {
  to: string;
  label: string;
  Icon: typeof House;
  end: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        padding: 4,
      }}
    >
      {({ isActive }) => (
        <motion.div
          whileTap={{ scale: 0.88 }}
          whileHover={
            isActive
              ? { scale: 1.06 }
              : { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.55)' }
          }
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          style={{
            width: ICON_SLOT,
            height: ICON_SLOT,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: 'transparent',
          }}
        >
          {isActive && (
            <motion.div
              layoutId="tab-icon-highlight"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 14,
                backgroundColor: '#0A0A0A',
                boxShadow: '0 4px 14px rgba(10, 10, 10, 0.28)',
              }}
            />
          )}
          <Icon
            size={24}
            weight={isActive ? 'fill' : 'regular'}
            color={isActive ? '#FFFFFF' : '#6B7280'}
            style={{ position: 'relative', zIndex: 1 }}
          />
        </motion.div>
      )}
    </NavLink>
  );
}
