import { NavLink } from 'react-router';
import { Home, List, BarChart2, Target, Settings } from 'lucide-react';

const TABS = [
  { to: '/',         label: 'Home',     Icon: Home },
  { to: '/expenses', label: 'Expenses', Icon: List },
  { to: '/insights', label: 'Insights', Icon: BarChart2 },
  { to: '/budget',   label: 'Budget',   Icon: Target },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomTabBar() {
  return (
    <nav
      style={{
        height: 76,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F0F0F5',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 10,
        flexShrink: 0,
        zIndex: 50,
        boxShadow: '0 -1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textDecoration: 'none',
            color: isActive ? '#3E37FF' : '#9CA3AF',
            transition: 'color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  backgroundColor: isActive ? '#EDEDFF' : 'transparent',
                  transition: 'background-color 0.15s',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: 0.2 }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
