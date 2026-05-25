import { motion } from 'motion/react';
import { Sparkle } from '@phosphor-icons/react';
import { useAppColors } from '../context/AppearanceContext';

export function ReceiptParseOverlay({ message }: { message: string }) {
  const c = useAppColors();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.overlay,
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 480, damping: 28 }}
        style={{
          backgroundColor: c.modalSheet,
          borderRadius: 20,
          padding: '28px 32px',
          maxWidth: 280,
          textAlign: 'center',
          boxShadow: c.shadow,
        }}
      >
        <motion.div
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: c.accentSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <Sparkle size={28} weight="fill" color={c.accent} />
        </motion.div>
        <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: '0 0 6px' }}>
          Reading with AI
        </p>
        <p style={{ fontSize: 13, color: c.textMuted, margin: 0, lineHeight: 1.45 }}>
          {message}
        </p>
      </motion.div>
    </div>
  );
}
