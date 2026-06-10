import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { ArrowsMerge, Warning } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { useAppMotion } from '../../hooks/useAppMotion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MODAL_HOST_ID } from '../BottomSheetModal';
import type { DataCounts, ImportMode } from '../../services/dataExportImport';

function formatCounts(counts: DataCounts): string[] {
  const items: string[] = [];
  if (counts.expenses > 0) {
    items.push(`${counts.expenses} expense${counts.expenses === 1 ? '' : 's'}`);
  }
  if (counts.income > 0) {
    items.push(`monthly income`);
  }
  if (counts.monthlyBudget > 0) {
    items.push(`monthly budget`);
  }
  if (counts.savingsGoals > 0) {
    items.push(`${counts.savingsGoals} saving goal${counts.savingsGoals === 1 ? '' : 's'}`);
  }
  if (counts.customCategories > 0) {
    items.push(`${counts.customCategories} custom categor${counts.customCategories === 1 ? 'y' : 'ies'}`);
  }
  if (counts.customizations > 0) {
    items.push(`${counts.customizations} category customization${counts.customizations === 1 ? '' : 's'}`);
  }
  return items.length > 0 ? items : ['No data'];
}

export function ImportDataModal({
  open,
  onClose,
  onConfirm,
  currentCounts,
  importCounts,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
  currentCounts: DataCounts;
  importCounts: DataCounts;
}) {
  const c = useAppColors();
  const { modalTransition, backdropMotion, reduceMotion } = useAppMotion();
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

  const handleBackdrop = () => onClose();

  const actionButtonStyle = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
  } as const;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={captureRef}
          key="import-overlay"
          role="presentation"
          initial={backdropMotion.initial}
          animate={backdropMotion.animate}
          exit={backdropMotion.exit}
          transition={modalTransition}
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
            key="import-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="import-data-title"
            aria-describedby="import-data-desc"
            initial={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.94, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
            transition={modalTransition}
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
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: c.accentSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <ArrowsMerge size={26} weight="light" color={c.accent} />
            </div>
            <h2
              id="import-data-title"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: c.text,
                textAlign: 'center',
                margin: '0 0 8px',
                lineHeight: 1.25,
              }}
            >
              Import data
            </h2>
            <p
              id="import-data-desc"
              style={{
                fontSize: 14,
                color: c.textMuted,
                textAlign: 'center',
                margin: '0 0 14px',
                lineHeight: 1.45,
              }}
            >
              You already have data in Spendr. Choose how to apply this file.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <SummaryBlock
                title="In this file"
                items={formatCounts(importCounts)}
                accent={c.accent}
                bg={c.accentSoft}
              />
              <SummaryBlock
                title="Currently in app"
                items={formatCounts(currentCounts)}
                accent="#6B7280"
                bg={c.surfaceInset}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: '#FEF3C7',
                marginBottom: 16,
              }}
            >
              <Warning size={18} weight="fill" color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.4 }}>
                Replace all removes your current expenses, budget, income, categories, and saving goals,
                then loads the file. Add to existing keeps your setup and merges in new items.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => onConfirm('merge')}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: c.accent,
                  color: c.onAccent,
                }}
              >
                Add to existing
              </button>
              <button
                type="button"
                onClick={() => onConfirm('overwrite')}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                }}
              >
                Replace all
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: c.surfaceInset,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!host) return null;
  return createPortal(overlay, host);
}

function SummaryBlock({
  title,
  items,
  accent,
  bg,
}: {
  title: string;
  items: string[];
  accent: string;
  bg: string;
}) {
  const c = useAppColors();
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        backgroundColor: bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          margin: '0 0 6px',
        }}
      >
        {title}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, color: c.textMuted, fontSize: 13, lineHeight: 1.45 }}>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
