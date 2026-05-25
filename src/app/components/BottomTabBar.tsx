import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { House, Receipt, Target, Gear } from '@phosphor-icons/react';
import { FabExpenseLauncher, FAB_SIZE } from './FabExpenseLauncher';

/** Reserve this at the bottom of scroll areas so content clears the floating bar */
export const TAB_BAR_CLEARANCE = 96;

const FLOAT_BOTTOM = 16;
const FLOAT_SIDES = 8;
const BAR_HEIGHT = 58;
const ICON_SLOT = 44;

const LEFT_TABS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/expenses', label: 'Expenses', Icon: Receipt, end: false },
] as const;

const RIGHT_TABS = [
  { to: '/budget', label: 'Budget', Icon: Target, end: false },
  { to: '/settings', label: 'Settings', Icon: Gear, end: false },
] as const;

export function BottomTabBar() {
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

          <FabExpenseLauncher />

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
              : { scale: 1.05, backgroundColor: 'var(--tab-hover-bg)' }
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
                backgroundColor: 'var(--tab-active-bg)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
              }}
            />
          )}
          <Icon
            size={24}
            weight={isActive ? 'fill' : 'regular'}
            color={isActive ? 'var(--tab-active-icon)' : 'var(--tab-inactive-icon)'}
            style={{ position: 'relative', zIndex: 1 }}
          />
        </motion.div>
      )}
    </NavLink>
  );
}
