import { Package } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAppearance } from '../context/AppearanceContext';
import { CATEGORY_ICON_MAP, type CategoryIconKey } from '../data/categoryConfig';
import { categoryDisplayColor } from '../theme/categoryDisplayColor';
import {
  ONBOARDING_CHIP_ICON,
  onboardingIconGradient,
} from '../theme/onboardingDarkUi';

interface CategoryIconProps {
  categoryId: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  /** `auto` follows app appearance; `dark` = gradient chip + white icon; `light` = no chip bg */
  tone?: 'light' | 'dark' | 'auto';
  /** Pill chips use a fully round icon container */
  shape?: 'rounded' | 'circle';
}

const SIZE_MAP = {
  xxs: { outer: 20, icon: 10, radius: 6 },
  xs: { outer: 28, icon: 14, radius: 8 },
  sm: { outer: 36, icon: 18, radius: 10 },
  md: { outer: 44, icon: 22, radius: 12 },
  lg: { outer: 56, icon: 28, radius: 14 },
};

export function CategoryIcon({
  categoryId,
  size = 'md',
  tone = 'auto',
  shape = 'rounded',
}: CategoryIconProps) {
  const { getCategory } = useApp();
  const { isDark: appDark } = useAppearance();
  const category = getCategory(categoryId);
  const dim = SIZE_MAP[size];
  const IconComp =
    CATEGORY_ICON_MAP[category.iconKey as CategoryIconKey] ?? Package;
  const isDark = tone === 'dark' || (tone === 'auto' && appDark);
  const chipAccent = categoryDisplayColor(category, isDark);
  const iconStroke = isDark
    ? ONBOARDING_CHIP_ICON
    : category.iconColor || category.color;
  const chipBg = isDark
    ? { background: onboardingIconGradient(chipAccent) }
    : tone === 'light'
      ? {}
      : { backgroundColor: category.bg };

  return (
    <div
      style={{
        width: dim.outer,
        height: dim.outer,
        borderRadius: shape === 'circle' ? '50%' : dim.radius,
        ...chipBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComp size={dim.icon} weight="light" color={iconStroke} />
    </div>
  );
}

interface CategoryDotProps {
  categoryId: string;
  size?: number;
}

export function CategoryDot({ categoryId, size = 10 }: CategoryDotProps) {
  const { getCategory } = useApp();
  const category = getCategory(categoryId);
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: category.color,
        flexShrink: 0,
      }}
    />
  );
}

/** For modals / previews */
export function CategoryIconPreview({
  iconKey,
  color,
  bg,
  iconColor,
  size = 'md',
  tone = 'auto',
}: {
  iconKey: CategoryIconKey;
  color: string;
  bg: string;
  iconColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark' | 'auto';
}) {
  const { isDark: appDark } = useAppearance();
  const dim = SIZE_MAP[size] ?? SIZE_MAP.md;
  const IconComp = CATEGORY_ICON_MAP[iconKey] ?? Package;
  const isDark = tone === 'dark' || (tone === 'auto' && appDark);
  const stroke = isDark ? ONBOARDING_CHIP_ICON : (iconColor ?? color);
  const chipBg = isDark
    ? { background: onboardingIconGradient(color) }
    : tone === 'light'
      ? {}
      : { backgroundColor: bg };

  return (
    <div
      style={{
        width: dim.outer,
        height: dim.outer,
        borderRadius: dim.radius,
        ...chipBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComp size={dim.icon} weight="light" color={stroke} />
    </div>
  );
}
