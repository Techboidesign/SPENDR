import type { CSSProperties, ReactNode } from 'react';

/**
 * Single white surface for chart/list content.
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
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
