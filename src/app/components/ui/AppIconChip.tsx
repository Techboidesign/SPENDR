import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { useAppearance } from '../../context/AppearanceContext';
import { uiIconChipStyle } from '../../theme/darkModeUi';

export function AppIconChip({
  icon: Icon,
  accentColor,
  lightBg,
  size = 34,
  iconSize = 16,
  radius = 9,
}: {
  icon: PhosphorIcon;
  accentColor: string;
  /** Pastel tile in light mode (e.g. `#EDEDFF`). */
  lightBg?: string;
  size?: number;
  iconSize?: number;
  radius?: number;
}) {
  const { isDark } = useAppearance();
  const chip = uiIconChipStyle(accentColor, isDark, lightBg);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...chip.containerStyle,
      }}
    >
      <Icon size={iconSize} weight="light" color={chip.iconColor} />
    </div>
  );
}
