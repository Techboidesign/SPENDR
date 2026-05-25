import { AnimatePresence, motion } from 'motion/react';
import { getCurrencyIcon } from '../../data/currencyConfig';
import { useAppearance } from '../../context/AppearanceContext';
import { uiIconChipStyle } from '../../theme/darkModeUi';

const CURRENCY_ACCENT = '#7C3AED';
const CURRENCY_LIGHT_BG = '#EDE9FE';

export function AnimatedCurrencyIcon({ currency }: { currency: string }) {
  const { isDark } = useAppearance();
  const Icon = getCurrencyIcon(currency);
  const chip = uiIconChipStyle(CURRENCY_ACCENT, isDark, CURRENCY_LIGHT_BG);

  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...chip.containerStyle,
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
          <Icon size={16} weight="light" color={chip.iconColor} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
