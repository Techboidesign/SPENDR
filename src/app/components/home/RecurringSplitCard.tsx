import { PieChart, Pie } from 'recharts';

type SplitRow = { name: string; value: number; color: string; fill: string };

export function RecurringSplitCard({
  data,
  grandTotal,
  recurringPct,
  formatCurrency,
  compact = false,
}: {
  data: SplitRow[];
  grandTotal: number;
  recurringPct: string;
  formatCurrency: (n: number) => string;
  compact?: boolean;
}) {
  const pieSize = compact ? 88 : 110;

  if (grandTotal === 0) {
    return (
      <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '16px 0' }}>
        No expense data for this period
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 14 : 20 }}>
      <div style={{ position: 'relative', width: pieSize, height: pieSize, flexShrink: 0 }}>
        <PieChart width={pieSize} height={pieSize} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 28 : 34}
            outerRadius={compact ? 42 : 50}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            animationDuration={600}
          />
        </PieChart>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <p style={{ fontSize: compact ? 13 : 14, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>
              {recurringPct}%
            </p>
            <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0, letterSpacing: 0.3 }}>FIXED</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
        {data.map(d => (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{formatCurrency(d.value)}</span>
            </div>
            <div style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: grandTotal > 0 ? `${(d.value / grandTotal) * 100}%` : '0%',
                backgroundColor: d.color,
                borderRadius: 2,
                animation: 'progressBarFill 0.8s ease-out both',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
