import { FloppyDisk } from '@phosphor-icons/react';

export const MODAL_ACTION_BAR_HEIGHT = 76;

type LeftVariant = 'cancel' | 'delete';

const LEFT_STYLES: Record<LeftVariant, { backgroundColor: string; color: string; border: string }> = {
  cancel: { backgroundColor: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' },
  delete: { backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none' },
};

export function ModalActionBar({
  onSave,
  onLeft,
  leftLabel,
  leftVariant = 'cancel',
  saveLabel = 'SAVE',
  saveDisabled = false,
  dark = false,
}: {
  onSave: () => void;
  onLeft: () => void;
  leftLabel: string;
  leftVariant?: LeftVariant;
  saveLabel?: string;
  saveDisabled?: boolean;
  /** For dark full-screen modals (e.g. avatar crop). */
  dark?: boolean;
}) {
  const left = LEFT_STYLES[leftVariant];

  return (
    <div
      style={{
        flexShrink: 0,
        padding: dark ? '12px 20px 24px' : '12px 20px 20px',
        backgroundColor: dark ? '#000000' : '#FFFFFF',
        borderTop: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F3F4F6',
        boxShadow: dark ? '0 -8px 32px rgba(0,0,0,0.5)' : '0 -8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onLeft}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            border: dark ? '1px solid rgba(255,255,255,0.2)' : left.border,
            backgroundColor: dark ? 'rgba(255,255,255,0.1)' : left.backgroundColor,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: dark ? '#FFFFFF' : left.color,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {leftLabel}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: saveDisabled ? '#C7C5FF' : '#3E37FF',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: '#FFFFFF',
            cursor: saveDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <FloppyDisk size={18} weight="bold" />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
