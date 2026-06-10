import { useState } from 'react';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { chartTooltipStyle } from '../../theme/darkModeUi';
import { INSIGHTS_CHOREOGRAPHY } from '../../theme/motion';

export function SpendingTrendChart({
  data,
  formatCurrency,
}: {
  data: { month: string; total: number; isLast: boolean }[];
  formatCurrency: (n: number) => string;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const tooltip = chartTooltipStyle();

  const axisPad = 44;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: axisPad }}>
        {data.map((d, i) => {
          const barH = Math.max((d.total / maxVal) * 120, d.total > 0 ? 4 : 0);
          const isEmpty = d.total === 0;
          const emptyBarH = 120;

          return (
            <div
              key={`bar-${i}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && d.total > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: barH + 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: tooltip.backgroundColor,
                    borderRadius: 8,
                    padding: '6px 10px',
                    boxShadow: tooltip.boxShadow,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  <p style={{ fontSize: 11, color: tooltip.labelColor, margin: '0 0 1px' }}>{d.month}</p>
                  <p className="font-figure" style={{ fontSize: 13, color: tooltip.valueColor, fontWeight: 700, margin: 0 }}>
                    {formatCurrency(d.total)}
                  </p>
                </div>
              )}
              {isEmpty ? (
                <div
                  style={{
                    width: '100%',
                    height: emptyBarH,
                    borderRadius: '5px 5px 0 0',
                    border: `1px dashed ${c.borderSubtle}`,
                    backgroundColor: c.surfaceInset,
                    backgroundImage: isDark
                      ? undefined
                      : 'repeating-linear-gradient(45deg, transparent, transparent 6px, #E5E7EB 6px, #E5E7EB 8px)',
                    transformOrigin: 'bottom',
                    animation: INSIGHTS_CHOREOGRAPHY.barGrow(i),
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: barH,
                    backgroundColor: d.isLast ? c.accent : c.accentSoft,
                    borderRadius: '5px 5px 0 0',
                    transformOrigin: 'bottom',
                    animation: INSIGHTS_CHOREOGRAPHY.barGrow(i),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: axisPad - 6,
          height: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          textAlign: 'right',
          paddingRight: 4,
          boxSizing: 'border-box',
        }}
      >
        {[1, 0.5, 0].map((frac, i) => (
          <span
            key={i}
            className="font-figure"
            style={{
              fontSize: 7,
              color: c.textFaint,
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCurrency(Math.round(maxVal * frac))}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: axisPad, height: 1, backgroundColor: c.surfaceInset }} />

      <div style={{ display: 'flex', gap: 4, paddingLeft: axisPad, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={`label-${i}`} style={{ flex: 1, textAlign: 'center' }}>
            <span
              style={{
                fontSize: 9,
                color: d.isLast ? c.accent : c.textFaint,
                fontWeight: d.isLast ? 600 : 400,
              }}
            >
              {d.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
