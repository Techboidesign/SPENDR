import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  House,
  ShoppingCart,
  ForkKnife,
  Car,
  DeviceMobile,
  FilmSlate,
  Heartbeat,
  ShoppingBag,
  Lightning,
  Package,
  Coffee,
  Airplane,
  BookOpen,
  Gift,
  PawPrint,
  Briefcase,
  Wallet,
  CreditCard,
  Bank,
  PiggyBank,
  TShirt,
  Barbell,
  Pill,
  Baby,
  GraduationCap,
  MusicNote,
  GameController,
  Wrench,
  Tree,
  Bicycle,
  GasPump,
  Storefront,
  Receipt,
  Laptop,
  Lightbulb,
  Globe,
} from '@phosphor-icons/react';
import { CATEGORIES, type Category } from './categories';
import type { CategoryCustomization, CustomCategory } from './types';

export type CategoryIconKey =
  | 'house'
  | 'cart'
  | 'fork'
  | 'car'
  | 'mobile'
  | 'film'
  | 'heart'
  | 'bag'
  | 'bolt'
  | 'package'
  | 'coffee'
  | 'plane'
  | 'book'
  | 'gift'
  | 'paw'
  | 'briefcase'
  | 'wallet'
  | 'card'
  | 'bank'
  | 'piggy'
  | 'shirt'
  | 'gym'
  | 'pill'
  | 'baby'
  | 'school'
  | 'music'
  | 'game'
  | 'tools'
  | 'nature'
  | 'bike'
  | 'fuel'
  | 'store'
  | 'receipt'
  | 'laptop'
  | 'bulb'
  | 'globe';

export const CATEGORY_ICON_OPTIONS: {
  key: CategoryIconKey;
  label: string;
  Icon: React.ComponentType<React.ComponentProps<typeof PhosphorIcon>>;
}[] = [
  { key: 'house', label: 'Home', Icon: House },
  { key: 'cart', label: 'Groceries', Icon: ShoppingCart },
  { key: 'fork', label: 'Food', Icon: ForkKnife },
  { key: 'car', label: 'Transport', Icon: Car },
  { key: 'mobile', label: 'Subs', Icon: DeviceMobile },
  { key: 'film', label: 'Fun', Icon: FilmSlate },
  { key: 'heart', label: 'Health', Icon: Heartbeat },
  { key: 'bag', label: 'Shopping', Icon: ShoppingBag },
  { key: 'bolt', label: 'Utilities', Icon: Lightning },
  { key: 'package', label: 'Other', Icon: Package },
  { key: 'coffee', label: 'Café', Icon: Coffee },
  { key: 'plane', label: 'Travel', Icon: Airplane },
  { key: 'book', label: 'Education', Icon: BookOpen },
  { key: 'gift', label: 'Gifts', Icon: Gift },
  { key: 'paw', label: 'Pets', Icon: PawPrint },
  { key: 'briefcase', label: 'Work', Icon: Briefcase },
  { key: 'wallet', label: 'Wallet', Icon: Wallet },
  { key: 'card', label: 'Card', Icon: CreditCard },
  { key: 'bank', label: 'Bank', Icon: Bank },
  { key: 'piggy', label: 'Savings', Icon: PiggyBank },
  { key: 'shirt', label: 'Clothes', Icon: TShirt },
  { key: 'gym', label: 'Fitness', Icon: Barbell },
  { key: 'pill', label: 'Meds', Icon: Pill },
  { key: 'baby', label: 'Kids', Icon: Baby },
  { key: 'school', label: 'School', Icon: GraduationCap },
  { key: 'music', label: 'Music', Icon: MusicNote },
  { key: 'game', label: 'Games', Icon: GameController },
  { key: 'tools', label: 'Repair', Icon: Wrench },
  { key: 'nature', label: 'Outdoors', Icon: Tree },
  { key: 'bike', label: 'Bike', Icon: Bicycle },
  { key: 'fuel', label: 'Fuel', Icon: GasPump },
  { key: 'store', label: 'Shop', Icon: Storefront },
  { key: 'receipt', label: 'Bills', Icon: Receipt },
  { key: 'laptop', label: 'Tech', Icon: Laptop },
  { key: 'bulb', label: 'Home', Icon: Lightbulb },
  { key: 'globe', label: 'World', Icon: Globe },
];

export const CATEGORY_ICON_MAP: Record<
  CategoryIconKey,
  React.ComponentType<React.ComponentProps<typeof PhosphorIcon>>
> = Object.fromEntries(CATEGORY_ICON_OPTIONS.map(o => [o.key, o.Icon])) as Record<
  CategoryIconKey,
  React.ComponentType<React.ComponentProps<typeof PhosphorIcon>>
>;

export const DEFAULT_ICON_BY_CATEGORY_ID: Record<string, CategoryIconKey> = {
  rent: 'house',
  groceries: 'cart',
  dining: 'fork',
  transport: 'car',
  subscriptions: 'mobile',
  entertainment: 'film',
  health: 'heart',
  shopping: 'bag',
  utilities: 'bolt',
  other: 'package',
};

export const CATEGORY_COLOR_PRESETS = [
  { id: 'indigo', color: '#3E37FF', bg: '#EDEDFF', iconColor: '#2D28B8' },
  { id: 'green', color: '#16A34A', bg: '#DCFCE7', iconColor: '#15803D' },
  { id: 'purple', color: '#7C3AED', bg: '#F3EDFD', iconColor: '#5B21B6' },
  { id: 'teal', color: '#0D9488', bg: '#CCFBF1', iconColor: '#0F766E' },
  { id: 'blue', color: '#2563EB', bg: '#DBEAFE', iconColor: '#1D4ED8' },
  { id: 'violet', color: '#4B13E8', bg: '#EEEAFD', iconColor: '#3B0FA8' },
  { id: 'orange', color: '#EA580C', bg: '#FFEDD5', iconColor: '#C2410C' },
  { id: 'amber', color: '#D97706', bg: '#FEF3C7', iconColor: '#B45309' },
  { id: 'pink', color: '#DB2777', bg: '#FCE7F3', iconColor: '#BE185D' },
  { id: 'rose', color: '#E11D48', bg: '#FFE4E6', iconColor: '#BE123C' },
  { id: 'slate', color: '#475569', bg: '#F1F5F9', iconColor: '#334155' },
  { id: 'charcoal', color: '#4A4A58', bg: '#E8E8EB', iconColor: '#3F3F48' },
] as const;

function hexToHue(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  if (chroma < 0.08) return 1000 + max * 100;
  let hue = 0;
  if (max === r) hue = ((g - b) / chroma + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / chroma + 2) / 6;
  else hue = ((r - g) / chroma + 4) / 6;
  return hue * 360;
}

const NEUTRAL_COLOR_IDS = new Set(['slate', 'charcoal']);

/** Presets ordered around the color wheel (reds → … → neutrals). */
export const CATEGORY_COLOR_PRESETS_BY_HUE = [
  ...CATEGORY_COLOR_PRESETS.filter(p => !NEUTRAL_COLOR_IDS.has(p.id)).sort(
    (a, b) => hexToHue(a.color) - hexToHue(b.color),
  ),
  ...CATEGORY_COLOR_PRESETS.filter(p => NEUTRAL_COLOR_IDS.has(p.id)),
];

/** Darken hex color for progress fills */
export function darkenHex(hex: string, factor = 0.82): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * factor);
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

export function resolveCategory(
  base: Category,
  custom?: CategoryCustomization,
): Category & { iconKey: CategoryIconKey } {
  const iconKey = custom?.iconKey ?? DEFAULT_ICON_BY_CATEGORY_ID[base.id] ?? 'package';
  return {
    ...base,
    name: custom?.name?.trim() || base.name,
    color: custom?.color ?? base.color,
    bg: custom?.bg ?? base.bg,
    iconColor: custom?.iconColor ?? base.iconColor ?? custom?.color ?? base.color,
    iconKey,
  };
}

function resolveCustomCategory(cat: CustomCategory): Category & { iconKey: CategoryIconKey } {
  return {
    id: cat.id,
    name: cat.name,
    color: cat.color,
    bg: cat.bg,
    iconColor: cat.iconColor ?? cat.color,
    iconKey: cat.iconKey as CategoryIconKey,
  };
}

export function resolveCategories(
  customizations: Record<string, CategoryCustomization> = {},
  customCategories: CustomCategory[] = [],
  disabledCategoryIds: string[] = [],
): (Category & { iconKey: CategoryIconKey })[] {
  const disabled = new Set(disabledCategoryIds);
  const builtIn = CATEGORIES.filter(cat => !disabled.has(cat.id)).map(cat =>
    resolveCategory(cat, customizations[cat.id]),
  );
  const custom = customCategories.map(resolveCustomCategory);
  return [...builtIn, ...custom];
}

export function getCategoryIconKey(
  categoryId: string,
  customizations: Record<string, CategoryCustomization> = {},
): CategoryIconKey {
  return (
    customizations[categoryId]?.iconKey ??
    DEFAULT_ICON_BY_CATEGORY_ID[categoryId] ??
    'package'
  );
}
