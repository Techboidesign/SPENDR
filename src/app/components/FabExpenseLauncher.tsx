import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppColors } from '../context/AppearanceContext';
import { FAB_COLOR_TRANSITION } from '../theme/motion';

export const FAB_SIZE = 68;
const FAB_BORDER = 2;
const TAP_TRANSITION = { duration: 0.1, ease: [0.4, 0, 0.2, 1] as const };

export const FAB_CENTER_TOP =
  Math.max(0, FAB_SIZE * (0.5 - 0.2) - 20) + 10;

export function FabExpenseLauncher() {
  const { openAddModal, isParsingReceipt } = useApp();
  const c = useAppColors();
  const brand = c.fab;
  const [pressing, setPressing] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: FAB_CENTER_TOP,
        transform: 'translate(-50%, -50%)',
        zIndex: 52,
        width: FAB_SIZE,
        height: FAB_SIZE,
      }}
    >
      <motion.button
        type="button"
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerCancel={() => setPressing(false)}
        onClick={() => {
          if (isParsingReceipt) return;
          openAddModal();
        }}
        aria-label="Add expense"
        disabled={isParsingReceipt}
        animate={{
          scale: pressing ? 0.92 : 1,
          backgroundColor: brand,
          boxShadow: '0 8px 28px rgba(62, 55, 255, 0.45), 0 2px 8px rgba(15, 23, 42, 0.15)',
        }}
        transition={{
          scale: TAP_TRANSITION,
          backgroundColor: FAB_COLOR_TRANSITION,
          boxShadow: FAB_COLOR_TRANSITION,
        }}
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: '50%',
          border: `${FAB_BORDER}px solid rgba(255, 255, 255, 0.95)`,
          cursor: isParsingReceipt ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          userSelect: 'none',
        }}
      >
        <Plus size={30} weight="bold" color="#FFFFFF" />
      </motion.button>
    </div>
  );
}
