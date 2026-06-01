import type { Icon } from '@phosphor-icons/react';
import { useOnboardingChrome } from '../../context/OnboardingThemeContext';
import { onboardingIconChip } from '../../theme/onboardingUi';

const CHIP = {
  md: { outer: 36, icon: 18, radius: 10 },
  sm: { outer: 36, icon: 16, radius: 10 },
  xs: { outer: 30, icon: 14, radius: 8 },
} as const;

/** Rounded icon tile — pastel in light onboarding, gradient in dark. */
export function OnboardingOptionIconChip({
  icon: IconComp,
  accentColor,
  size = 'md',
}: {
  icon: Icon;
  accentColor: string;
  size?: keyof typeof CHIP;
}) {
  const { isLight } = useOnboardingChrome();
  const chip = onboardingIconChip(accentColor, isLight);
  const dim = CHIP[size];

  return (
    <div
      style={{
        width: dim.outer,
        height: dim.outer,
        borderRadius: dim.radius,
        background: chip.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComp size={dim.icon} weight="light" color={chip.iconColor} />
    </div>
  );
}
