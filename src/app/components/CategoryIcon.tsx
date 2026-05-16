import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  House, ShoppingCart, ForkKnife, Car, DeviceMobile,
  FilmSlate, Heartbeat, ShoppingBag, Lightning, Package,
} from '@phosphor-icons/react';
import { getCategoryById } from '../data/categories';

// Map each category id → Phosphor icon component
const CATEGORY_ICONS: Record<string, React.ComponentType<React.ComponentProps<typeof PhosphorIcon>>> = {
  rent:          House,
  groceries:     ShoppingCart,
  dining:        ForkKnife,
  transport:     Car,
  subscriptions: DeviceMobile,
  entertainment: FilmSlate,
  health:        Heartbeat,
  shopping:      ShoppingBag,
  utilities:     Lightning,
  other:         Package,
};

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
  const category = getCategoryById(categoryId);
  const dim = SIZE_MAP[size];
  const IconComp = CATEGORY_ICONS[categoryId] ?? Package;
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
  const category = getCategoryById(categoryId);
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
