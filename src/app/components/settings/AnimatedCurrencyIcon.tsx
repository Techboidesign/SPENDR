import { AnimatePresence, motion } from 'motion/react';
import { getCurrencyIcon } from '../../data/currencyConfig';

const ICON_BG = '#EDE9FE';
const ICON_COLOR = '#7C3AED';

export function AnimatedCurrencyIcon({ currency }: { currency: string }) {
  const Icon = getCurrencyIcon(currency);

  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: ICON_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currency}
          initial={{ opacity: 0, scale: 0.5, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 18 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon size={16} weight="light" color={ICON_COLOR} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
