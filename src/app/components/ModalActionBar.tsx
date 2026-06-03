import { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import { useAppColors, useAppearance } from '../context/AppearanceContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const MODAL_ACTION_BAR_HEIGHT = 76;

type LeftVariant = 'cancel' | 'delete';

export function ModalActionBar({
  onSave,
  onPrimary,
  onLeft,
  onSecondary,
  leftLabel,
  secondaryLabel,
  leftVariant = 'cancel',
  saveLabel,
  primaryLabel,
  saveDisabled = false,
  primaryDisabled,
  /** Shown when the user taps save while it is disabled */
  saveDisabledHint,
  /** Force dark chrome (e.g. avatar crop). Defaults to app appearance. */
  dark,
}: {
  onSave?: () => void;
  onPrimary?: () => void;
  onLeft?: () => void;
  onSecondary?: () => void;
  leftLabel?: string;
  secondaryLabel?: string;
  leftVariant?: LeftVariant;
  saveLabel?: string;
  primaryLabel?: string;
  saveDisabled?: boolean;
  primaryDisabled?: boolean;
  saveDisabledHint?: string;
  dark?: boolean;
}) {
  const handleSave = onSave ?? onPrimary;
  const handleLeft = onLeft ?? onSecondary;
  const resolvedLeftLabel = leftLabel ?? secondaryLabel ?? 'CANCEL';
  const resolvedSaveLabel = saveLabel ?? primaryLabel ?? 'SAVE';
  const resolvedSaveDisabled = saveDisabled || Boolean(primaryDisabled);
  const [saveHintOpen, setSaveHintOpen] = useState(false);
  const showSaveHint = resolvedSaveDisabled && Boolean(saveDisabledHint);

  if (!handleSave || !handleLeft) return null;
  const c = useAppColors();
  const { isDark: appDark } = useAppearance();
  const isDark = dark ?? appDark;

  const leftBg =
    leftVariant === 'delete'
      ? isDark
        ? '#3A1C1C'
        : '#FEE2E2'
      : isDark
        ? c.inputBg
        : '#FFFFFF';
  const leftColor = leftVariant === 'delete' ? c.danger : isDark ? c.textSecondary : '#6B7280';
  const leftBorder =
    leftVariant === 'delete' ? 'none' : `1px solid ${isDark ? c.inputBorder : '#E5E7EB'}`;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '12px 20px',
        backgroundColor: c.modalSheet,
        borderTop: `1px solid ${isDark ? c.border : '#F3F4F6'}`,
        boxShadow: isDark ? c.shadow : '0 -8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={handleLeft}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 14,
            border: leftBorder,
            backgroundColor: leftBg,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: leftColor,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {resolvedLeftLabel}
        </button>
        {showSaveHint ? (
          <Tooltip open={saveHintOpen} onOpenChange={setSaveHintOpen}>
            <TooltipTrigger asChild>
              <span
                style={{ flex: 1, display: 'flex', minWidth: 0 }}
                onClick={() => setSaveHintOpen(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSaveHintOpen(true);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={saveDisabledHint}
              >
                <button
                  type="button"
                  disabled
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: isDark ? '#3D3A6E' : '#C7C5FF',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    color: c.onAccent,
                    cursor: 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    pointerEvents: 'none',
                  }}
                >
                  <FloppyDisk size={18} weight="bold" />
                  {resolvedSaveLabel}
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={6}
              className="border-0 shadow-md"
              style={{
                backgroundColor: isDark ? '#1E1E2A' : '#1A1A2E',
                color: '#F8FAFC',
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 10px',
              }}
            >
              {saveDisabledHint}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: c.accent,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: c.onAccent,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <FloppyDisk size={18} weight="bold" />
            {resolvedSaveLabel}
          </button>
        )}
      </div>
    </div>
  );
}
