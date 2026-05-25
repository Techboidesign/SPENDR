import type { CSSProperties, ReactNode } from 'react';
import { useAppColors } from '../../context/AppearanceContext';

/**
 * Single surface for chart/list content.
 * Do not wrap stacks of item cards — use one SurfaceCard OR many item cards, not both.
 */
export function SurfaceCard({
  children,
  style,
  padding = 16,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number | string;
}) {
  const c = useAppColors();
  return (
    <div
      style={{
        backgroundColor: c.surface,
        borderRadius: 16,
        padding,
        boxShadow: c.shadowCard,
        ...style,
      }}
    >
      {children}
    </div>
  );
}