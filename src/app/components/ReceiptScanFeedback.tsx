import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';

/** Shows a success banner after high-confidence receipt auto-save. */
export function ReceiptScanFeedback() {
  const { receiptScanToast, clearReceiptScanToast } = useApp();
  const { showNotification } = useNotifications();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!receiptScanToast || receiptScanToast.id === lastIdRef.current) return;
    lastIdRef.current = receiptScanToast.id;
    showNotification({
      id: receiptScanToast.id,
      title: receiptScanToast.title,
      message: receiptScanToast.message,
      variant: 'success',
      action: {
        type: 'view-expense',
        expenseId: receiptScanToast.expenseId,
        monthKey: receiptScanToast.monthKey,
      },
    });
    clearReceiptScanToast();
  }, [receiptScanToast, showNotification, clearReceiptScanToast]);

  return null;
}
