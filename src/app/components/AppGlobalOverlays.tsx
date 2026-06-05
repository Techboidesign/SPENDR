import { AddExpenseModal } from './AddExpenseModal';
import { ReceiptParseOverlay } from './ReceiptParseOverlay';
import { ReceiptScanFeedback } from './ReceiptScanFeedback';
import { useApp } from '../context/AppContext';

/** Add-expense sheet and receipt parsing — must mount on every main-app shell (tabs + Settings). */
export function AppGlobalOverlays() {
  const { showAddModal, isParsingReceipt, parseStatusMessage } = useApp();

  return (
    <>
      <ReceiptScanFeedback />
      {isParsingReceipt && <ReceiptParseOverlay message={parseStatusMessage} />}
      {showAddModal ? <AddExpenseModal /> : null}
    </>
  );
}
