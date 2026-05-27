import { Outlet } from 'react-router';
import { BottomTabBar } from './BottomTabBar';
import { MODAL_OVERLAY_Z } from './BottomSheetModal';
import { AddExpenseModal } from './AddExpenseModal';
import { ReceiptParseOverlay } from './ReceiptParseOverlay';
import { useApp } from '../context/AppContext';
import DeviceShell from './DeviceShell';
import { NotificationAlertRunner } from './NotificationAlertRunner';

export default function RootLayout() {
  const { showAddModal, isParsingReceipt, parseStatusMessage } = useApp();

  return (
    <DeviceShell
      chrome={
        <>
          <BottomTabBar />
          <div
            id="app-modal-host"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: MODAL_OVERLAY_Z,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
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
      <NotificationAlertRunner />
      <Outlet />
    </DeviceShell>
  );
}
