import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CategoryIcon, CategoryIconPreview } from '../CategoryIcon';
import type { CategoryIconKey } from '../../data/categoryConfig';
import { useOnboardingChrome } from '../../context/OnboardingThemeContext';
import { APP_PRIMARY } from '../../theme/authTheme';
import { hexToRgba } from '../../theme/onboardingUi';

const ICON_OUTER = 28;
const ICON_OVERLAP = 10;
const ICON_STEP = ICON_OUTER - ICON_OVERLAP;
const MORE_CHIP_WIDTH = 34;

export type CategoryStripItem =
  | { kind: 'builtin'; id: string; name: string }
  | {
      kind: 'custom';
      id: string;
      name: string;
      iconKey: CategoryIconKey;
      color: string;
      bg: string;
      iconColor?: string;
    };

function rowWidthFor(visible: number, hidden: number): number {
  if (visible <= 0) return hidden > 0 ? MORE_CHIP_WIDTH : 0;
  const iconsW = ICON_OUTER + (visible - 1) * ICON_STEP;
  return iconsW + (hidden > 0 ? MORE_CHIP_WIDTH - ICON_OVERLAP : 0);
}

function fitVisibleCount(total: number, containerWidth: number): { visible: number; hidden: number } {
  if (total === 0 || containerWidth <= 0) return { visible: 0, hidden: 0 };

  for (let visible = total; visible >= 1; visible--) {
    const hidden = total - visible;
    if (rowWidthFor(visible, hidden) <= containerWidth) {
      return { visible, hidden };
    }
  }

  return { visible: 0, hidden: total };
}

function CategoryStripIcon({
  item,
  title,
  iconTone,
}: {
  item: CategoryStripItem;
  title: string;
  iconTone: 'light' | 'dark';
}) {
  return (
    <div title={title} aria-label={title}>
      {item.kind === 'builtin' ? (
        <CategoryIcon categoryId={item.id} size="xs" tone={iconTone} />
      ) : (
        <CategoryIconPreview
          iconKey={item.iconKey}
          color={item.color}
          bg={item.bg}
          iconColor={item.iconColor}
          size="xs"
          tone={iconTone}
        />
      )}
    </div>
  );
}

export function OnboardingCategoryPreviewStrip({ items }: { items: CategoryStripItem[] }) {
  const { theme, isLight } = useOnboardingChrome();
  const iconTone = isLight ? 'light' : 'dark';
  const rowRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const measure = () => setContainerWidth(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { visible, hidden } = useMemo(
    () => fitVisibleCount(items.length, containerWidth),
    [items.length, containerWidth],
  );

  const visibleItems = items.slice(0, visible);
  const ringColor = theme.bgSolid;

  return (
    <div
      ref={rowRef}
      style={{
        width: '100%',
        minHeight: ICON_OUTER,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          height: ICON_OUTER,
        }}
        aria-label={
          hidden > 0
            ? `${items.length} categories, ${hidden} more not shown`
            : `${items.length} categories`
        }
      >
        {visibleItems.map((item, index) => (
          <div
            key={item.kind === 'builtin' ? item.id : item.id}
            style={{
              flexShrink: 0,
              marginLeft: index === 0 ? 0 : -ICON_OVERLAP,
              zIndex: index + 1,
              position: 'relative',
              borderRadius: 8,
              boxShadow: `0 0 0 1px ${ringColor}`,
            }}
          >
            <CategoryStripIcon item={item} title={item.name} iconTone={iconTone} />
          </div>
        ))}

        {hidden > 0 ? (
          <div
            title={`${hidden} more categor${hidden === 1 ? 'y' : 'ies'}`}
            style={{
              flexShrink: 0,
              width: ICON_OUTER,
              height: ICON_OUTER,
              marginLeft: visible > 0 ? -ICON_OVERLAP : 0,
              zIndex: visible + 1,
              position: 'relative',
              borderRadius: 8,
              boxShadow: `0 0 0 1px ${ringColor}`,
              background: isLight
                ? hexToRgba(APP_PRIMARY, 0.12)
                : `linear-gradient(135deg, rgba(62, 55, 255, 0.55) 0%, ${theme.surface} 100%)`,
              border: `1px solid ${theme.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: theme.textPrimary,
              letterSpacing: -0.02,
            }}
          >
            +{hidden}
          </div>
        ) : null}
      </div>
    </div>
  );
}
