import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomTabBar } from './BottomTabBar';
import { MODAL_OVERLAY_Z } from './BottomSheetModal';
import { AddExpenseModal } from './AddExpenseModal';
import { ReceiptParseOverlay } from './ReceiptParseOverlay';
import { useApp } from '../context/AppContext';
import DeviceShell from './DeviceShell';
import { NotificationAlertRunner } from './NotificationAlertRunner';
import { releaseAppScrollElement } from '../hooks/useScrollLock';

export default function RootLayout() {
  const { showAddModal, isParsingReceipt, parseStatusMessage } = useApp();
  const location = useLocation();

  useEffect(() => {
    document.querySelectorAll('[data-app-scroll]').forEach(node => {
      releaseAppScrollElement(node as HTMLElement);
    });
  }, [location.pathname]);

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
