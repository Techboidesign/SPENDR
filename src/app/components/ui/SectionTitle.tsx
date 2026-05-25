import type { ReactNode } from 'react';
import { useAppColors } from '../../context/AppearanceContext';
import { sectionTitleStyle } from '../../theme/typography';

/**
 * Section heading above cards — uppercase faint gray (matches Settings section labels).
 * Always outside cards; see `.cursor/rules/card-section-titles.mdc`.
 */
export function SectionTitle({
  children,
  action,
  inset,
}: {
  children: ReactNode;
  action?: ReactNode;
  /** Extra horizontal padding (e.g. expense date groups). */
  inset?: boolean;
}) {
  const c = useAppColors();
  const label =
    typeof children === 'string' ? children.toUpperCase() : children;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        padding: inset ? '12px 16px 6px' : '0 2px',
        gap: 8,
      }}
    >
      <h2 style={sectionTitleStyle(c)}>{label}</h2>
      {action}
    </div>
  );
}
