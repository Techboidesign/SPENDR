import { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useAppColors } from '../../context/AppearanceContext';
import { chartTooltipStyle } from '../../theme/darkModeUi';
import { CategoryIcon } from '../CategoryIcon';

export function CategorySpendingChart({
  segments,
  formatCurrency,
  animationKey,
  animateEntry = true,
}: {
  segments: Array<{ id: string; name: string; color: string; amount: number }>;
  formatCurrency: (n: number) => string;
  /** Changes retrigger bar grow-in (e.g. month + view mode on Expenses insights). */
  animationKey?: string;
  /** When false, columns render at full height immediately (no grow-in). */
  animateEntry?: boolean;
}) {
  const c = useAppColors();
  const reduceMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const BAR_H = 120;
  const maxVal = Math.max(...segments.map(s => s.amount), 1);

  if (segments.length === 0) {
    return (
      <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '24px 0' }}>
        No spending in this month yet
      </p>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: 36 }}>
        {segments.map((seg, i) => {
          const barH = Math.max((seg.amount / maxVal) * BAR_H, 4);
          const isHovered = hoveredId === seg.id;
          const dimmed = hoveredId !== null && !isHovered;

          return (
            <div
              key={seg.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                minWidth: 0,
              }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: barH + 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: chartTooltipStyle().backgroundColor,
                  borderRadius: 8,
                  padding: '6px 10px',
                  boxShadow: chartTooltipStyle().boxShadow,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  <p style={{ fontSize: 11, color: chartTooltipStyle().labelColor, margin: '0 0 1px' }}>{seg.name}</p>
                  <p className="font-figure" style={{ fontSize: 13, color: chartTooltipStyle().valueColor, margin: 0 }}>
                    {formatCurrency(seg.amount)}
                  </p>
                </div>
              )}
              <div
                key={animateEntry && animationKey ? `${animationKey}-${seg.id}` : seg.id}
                className={animateEntry && !reduceMotion ? 'spendr-chart-bar-grow' : undefined}
                style={{
                  width: '100%',
                  height: barH,
                  backgroundColor: seg.color,
                  borderRadius: '5px 5px 0 0',
                  cursor: 'pointer',
                  transformOrigin: 'bottom center',
                  opacity: dimmed ? 0.45 : 1,
                  transform:
                    animateEntry && !reduceMotion
                      ? isHovered
                        ? 'scaleX(1.06)'
                        : 'scaleX(1)'
                      : 'scaleY(0)',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                  ['--bar-delay' as string]: `${i * 40}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {[1, 0.5, 0].map((frac, i) => (
          <span key={i} style={{ fontSize: 9, color: c.textFaint }}>
            €{Math.round(maxVal * frac)}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: 36, height: 1, backgroundColor: c.surfaceInset }} />

      <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 6, alignItems: 'flex-end' }}>
        {segments.map(seg => {
          const isHovered = hoveredId === seg.id;
          const dimmed = hoveredId !== null && !isHovered;

          return (
            <div
              key={`label-${seg.id}`}
              role="button"
              tabIndex={0}
              title={seg.name}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(seg.id)}
              onBlur={() => setHoveredId(null)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setHoveredId(seg.id);
              }}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                minWidth: 0,
                cursor: 'pointer',
                opacity: dimmed ? 0.45 : 1,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
                borderRadius: 10,
                padding: '2px 0',
              }}
            >
              <CategoryIcon categoryId={seg.id} size="xs" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
