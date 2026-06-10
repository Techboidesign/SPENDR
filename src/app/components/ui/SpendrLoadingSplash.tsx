import { motion, useReducedMotion } from 'motion/react';
import { SpendrLogo } from '../auth/SpendrLogo';
import { useAppColors } from '../../context/AppearanceContext';

const LOGO_SIZE = 72;

export function SpendrLoadingSplash({ message }: { message?: string }) {
  const c = useAppColors();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        gap: 18,
        padding: 24,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: LOGO_SIZE + 24,
          height: LOGO_SIZE + 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!reduceMotion && (
          <>
            <motion.div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '28%',
                border: `2px solid ${c.accent}`,
              }}
              animate={{ scale: [0.92, 1.18], opacity: [0.45, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '28%',
                border: `2px solid ${c.accent}`,
              }}
              animate={{ scale: [0.92, 1.18], opacity: [0.45, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
            />
          </>
        )}

        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <SpendrLogo size={LOGO_SIZE} />
        </motion.div>
      </div>

      {message ? (
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: c.textMuted,
            margin: 0,
            letterSpacing: 0.1,
          }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
