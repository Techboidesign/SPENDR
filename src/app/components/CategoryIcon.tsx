import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Package } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { CATEGORY_ICON_MAP, type CategoryIconKey } from '../data/categoryConfig';

interface CategoryIconProps {
  categoryId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  xs: { outer: 28, icon: 14, radius: 8 },
  sm: { outer: 36, icon: 18, radius: 10 },
  md: { outer: 44, icon: 22, radius: 12 },
  lg: { outer: 56, icon: 28, radius: 14 },
};

export function CategoryIcon({ categoryId, size = 'md' }: CategoryIconProps) {
  const { getCategory } = useApp();
  const category = getCategory(categoryId);
  const dim = SIZE_MAP[size];
  const IconComp =
    CATEGORY_ICON_MAP[category.iconKey as CategoryIconKey] ?? Package;
  const iconColor = category.iconColor || category.color;

  return (
    <div
      style={{
        width: dim.outer,
        height: dim.outer,
        borderRadius: dim.radius,
        backgroundColor: category.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComp size={dim.icon} weight="light" color={iconColor} />
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
}: {
  iconKey: CategoryIconKey;
  color: string;
  bg: string;
  iconColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const dim = SIZE_MAP[size];
  const IconComp = CATEGORY_ICON_MAP[iconKey] ?? Package;
  return (
    <div
      style={{
        width: dim.outer,
        height: dim.outer,
        borderRadius: dim.radius,
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <IconComp size={dim.icon} weight="light" color={iconColor ?? color} />
    </div>
  );
}
