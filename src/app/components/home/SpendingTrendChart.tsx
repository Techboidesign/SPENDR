import { useState } from 'react';
import { INSIGHTS_CHOREOGRAPHY } from '../../theme/motion';

export function SpendingTrendChart({
  data,
}: {
  data: { month: string; total: number; isLast: boolean }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingLeft: 36 }}>
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
                <div style={{
                  position: 'absolute',
                  bottom: barH + 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#1A1A2E',
                  borderRadius: 8,
                  padding: '6px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 1px' }}>{d.month}</p>
                  <p style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
                    €{d.total.toFixed(0)}
                  </p>
                </div>
              )}
              {isEmpty ? (
                <div style={{
                  width: '100%',
                  height: emptyBarH,
                  borderRadius: '5px 5px 0 0',
                  border: '1px dashed #D1D5DB',
                  backgroundColor: '#FAFAFA',
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 6px, #E5E7EB 6px, #E5E7EB 8px)',
                  transformOrigin: 'bottom',
                  animation: INSIGHTS_CHOREOGRAPHY.barGrow(i),
                }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: barH,
                  backgroundColor: d.isLast ? '#3E37FF' : '#EDEDFF',
                  borderRadius: '5px 5px 0 0',
                  transformOrigin: 'bottom',
                  animation: INSIGHTS_CHOREOGRAPHY.barGrow(i),
                }} />
              )}
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
          <span key={i} style={{ fontSize: 9, color: '#9CA3AF' }}>
            €{Math.round(maxVal * frac)}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: 36, height: 1, backgroundColor: '#F3F4F6' }} />

      <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={`label-${i}`} style={{ flex: 1, textAlign: 'center' }}>
            <span
              style={{
                fontSize: 9,
                color: d.isLast ? '#3E37FF' : '#9CA3AF',
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
