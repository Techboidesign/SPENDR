import { useState } from 'react';
import { CategoryIcon } from '../CategoryIcon';

export function CategorySpendingChart({
  segments,
  formatCurrency,
}: {
  segments: Array<{ id: string; name: string; color: string; amount: number }>;
  formatCurrency: (n: number) => string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const BAR_H = 120;
  const maxVal = Math.max(...segments.map(s => s.amount), 1);

  if (segments.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '24px 0' }}>
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
                  backgroundColor: '#1A1A2E',
                  borderRadius: 8,
                  padding: '6px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 1px' }}>{seg.name}</p>
                  <p style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
                    {formatCurrency(seg.amount)}
                  </p>
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  height: barH,
                  backgroundColor: seg.color,
                  borderRadius: '5px 5px 0 0',
                  cursor: 'default',
                  transformOrigin: 'bottom',
                  animation: `barGrow 0.6s ease-out ${i * 0.04}s both`,
                  opacity: dimmed ? 0.45 : 1,
                  transition: 'opacity 0.15s',
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
          <span key={i} style={{ fontSize: 9, color: '#9CA3AF' }}>
            €{Math.round(maxVal * frac)}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: 36, height: 1, backgroundColor: '#F3F4F6' }} />

      <div style={{ display: 'flex', gap: 4, paddingLeft: 36, marginTop: 6, alignItems: 'flex-end' }}>
        {segments.map(seg => (
          <div
            key={`label-${seg.id}`}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}
            title={seg.name}
          >
            <CategoryIcon categoryId={seg.id} size="xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
