import { Outlet } from 'react-router';
import { BottomTabBar } from './BottomTabBar';
import { AddExpenseModal } from './AddExpenseModal';
import { ReceiptParseOverlay } from './ReceiptParseOverlay';
import { useApp } from '../context/AppContext';
import DeviceShell from './DeviceShell';

export default function RootLayout() {
  const { showAddModal, isParsingReceipt, parseStatusMessage } = useApp();

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
      overlay={
        <>
          {isParsingReceipt && <ReceiptParseOverlay message={parseStatusMessage} />}
          {showAddModal ? <AddExpenseModal /> : null}
        </>
      }
    >
      <Outlet />
    </DeviceShell>
  );
}
