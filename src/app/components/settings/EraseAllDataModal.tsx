import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { Warning, DownloadSimple, Trash, ArrowLeft } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MODAL_HOST_ID, MODAL_TRANSITION } from '../BottomSheetModal';

type Step = 'overview' | 'confirm';

export function EraseAllDataModal({
  open,
  onClose,
  onExport,
  onConfirmErase,
  expenseCount,
  customCategoryCount,
  customizationCount,
}: {
  open: boolean;
  onClose: () => void;
  onExport: () => boolean;
  onConfirmErase: () => Promise<void>;
  expenseCount: number;
  customCategoryCount: number;
  customizationCount: number;
}) {
  const c = useAppColors();
  const [step, setStep] = useState<Step>('overview');
  const [exportAcknowledged, setExportAcknowledged] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  useLayoutEffect(() => {
    setHost(document.getElementById(MODAL_HOST_ID));
  }, [open]);

  useEffect(() => {
    const el = captureRef.current;
    if (!open || !el) return;
    const blockTouchScroll = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', blockTouchScroll, { passive: false });
    return () => el.removeEventListener('touchmove', blockTouchScroll);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStep('overview');
    setExportAcknowledged(false);
    setIsErasing(false);
  }, [open]);

  const handleExport = () => {
    const ok = onExport();
    if (ok) setExportAcknowledged(true);
  };

  const handleErase = async () => {
    setIsErasing(true);
    try {
      await onConfirmErase();
      onClose();
    } finally {
      setIsErasing(false);
    }
  };

  const handleBackdrop = () => {
    if (isErasing) return;
    if (step === 'confirm') {
      setStep('overview');
      return;
    }
    onClose();
  };

  const handleCancel = () => {
    if (isErasing) return;
    onClose();
  };

  const cancelButtonStyle: CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: `1px solid ${c.border}`,
    backgroundColor: c.surfaceInset,
    cursor: isErasing ? 'default' : 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    color: c.text,
    opacity: isErasing ? 0.5 : 1,
  };

  const summaryItems = [
    expenseCount > 0
      ? `${expenseCount} expense${expenseCount === 1 ? '' : 's'}`
      : 'No expenses',
    'Budget, goals, and spending history',
    customCategoryCount > 0
      ? `${customCategoryCount} custom categor${customCategoryCount === 1 ? 'y' : 'ies'}`
      : null,
    customizationCount > 0
      ? `${customizationCount} category customization${customizationCount === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean) as string[];

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={captureRef}
          key="erase-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MODAL_TRANSITION}
          onClick={handleBackdrop}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
            backgroundColor: 'rgba(0, 0, 0, 0.52)',
            touchAction: 'none',
            pointerEvents: 'auto',
            overscrollBehavior: 'none',
          }}
        >
          <motion.div
            key="erase-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="erase-data-title"
            aria-describedby="erase-data-desc"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={MODAL_TRANSITION}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: c.surface,
              borderRadius: 20,
              padding: '22px 20px 18px',
              boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            {step === 'overview' ? (
              <>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <Warning size={26} weight="fill" color="#EF4444" />
                </div>
                <h2
                  id="erase-data-title"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: c.text,
                    textAlign: 'center',
                    margin: '0 0 8px',
                    lineHeight: 1.25,
                  }}
                >
                  Erase all data?
                </h2>
                <p
                  id="erase-data-desc"
                  style={{
                    fontSize: 14,
                    color: c.textMuted,
                    textAlign: 'center',
                    margin: '0 0 14px',
                    lineHeight: 1.5,
                  }}
                >
                  This permanently removes your financial data from Spendr. Your account and profile stay as they are.
                </p>
                <ul style={{
                  margin: '0 0 14px',
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: c.canvas,
                  listStyle: 'none',
                }}>
                  {summaryItems.map(item => (
                    <li
                      key={item}
                      style={{
                        fontSize: 13,
                        color: c.text,
                        lineHeight: 1.45,
                        padding: '4px 0',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ color: '#EF4444', fontWeight: 700, flexShrink: 0 }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p style={{
                  fontSize: 12,
                  color: c.textFaint,
                  textAlign: 'center',
                  margin: '0 0 16px',
                  lineHeight: 1.45,
                }}>
                  Export a backup first if you might need this data later.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 14,
                    border: `1.5px solid ${c.border}`,
                    backgroundColor: c.surface,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    color: c.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <DownloadSimple size={18} weight="light" color={c.accent} />
                  {exportAcknowledged ? 'CSV exported — you’re set' : 'Export CSV first'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Continue to erase
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep('overview')}
                  disabled={isErasing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    marginBottom: 12,
                    cursor: isErasing ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    color: c.accent,
                    opacity: isErasing ? 0.5 : 1,
                  }}
                >
                  <ArrowLeft size={16} weight="light" color={c.accent} />
                  Back
                </button>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <Trash size={24} weight="fill" color="#EF4444" />
                </div>
                <h2
                  id="erase-data-title"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: c.text,
                    textAlign: 'center',
                    margin: '0 0 8px',
                  }}
                >
                  Last chance
                </h2>
                <p
                  id="erase-data-desc"
                  style={{
                    fontSize: 14,
                    color: c.textMuted,
                    textAlign: 'center',
                    margin: '0 0 18px',
                    lineHeight: 1.5,
                  }}
                >
                  {expenseCount > 0
                    ? `All ${expenseCount} expense${expenseCount === 1 ? '' : 's'} will be deleted. This cannot be undone.`
                    : 'All budgets and spending data will be cleared. This cannot be undone.'}
                </p>
                <button
                  type="button"
                  onClick={handleErase}
                  disabled={isErasing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: isErasing ? '#FCA5A5' : '#EF4444',
                    color: '#FFFFFF',
                    cursor: isErasing ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Trash size={18} weight="fill" color="#FFFFFF" />
                  {isErasing ? 'Erasing…' : 'Erase all data'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isErasing}
                  style={cancelButtonStyle}
                >
                  Keep my data
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!open || !host) return null;
  return createPortal(overlay, host);
}
