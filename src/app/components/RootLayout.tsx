import { Outlet } from 'react-router';
import { BottomTabBar } from './BottomTabBar';
import { AddExpenseModal } from './AddExpenseModal';
import { useApp } from '../context/AppContext';
import DeviceShell from './DeviceShell';

export default function RootLayout() {
  const { showAddModal } = useApp();

  return (
    <DeviceShell
      chrome={
        <>
          <BottomTabBar />
          <div
            id="app-modal-host"
            style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none' }}
          />
        </>
      }
      overlay={showAddModal ? <AddExpenseModal /> : null}
    >
      <Outlet />
    </DeviceShell>
  );
}
