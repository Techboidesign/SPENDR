import type { ReactNode } from 'react';

/** Section heading — always sits above cards, never inside a card (see Goals / Budget). */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: '0 2px',
        gap: 8,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{children}</h2>
      {action}
    </div>
  );
}
