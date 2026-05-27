import { useId, useMemo } from 'react';
import { AUTH_THEME, appPrimaryDarkRgba } from '../../theme/authTheme';
import { FormInput } from '../shared/FormFields';
import {
  AMOUNT_SLIDER_FINE_FRACTION,
  AMOUNT_SLIDER_FINE_MAX,
  amountToSliderPosition,
  amountToSliderStep,
  buildSliderTickPositions,
  clampSliderAmount,
  formatSliderAmountLabel,
  resolveAmountSliderScale,
  sliderStepToAmount,
} from '../../utils/nonLinearAmountScale';

type OnboardingAmountFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** When set, slider and input are capped (e.g. budget ≤ income). */
  maxAmount?: number;
  helperText?: string;
};

export function OnboardingAmountField({
  label,
  value,
  onChange,
  maxAmount,
  helperText,
}: OnboardingAmountFieldProps) {
  const sliderId = useId();
  const scale = resolveAmountSliderScale(maxAmount);
  const tickPositions = useMemo(() => buildSliderTickPositions(maxAmount), [maxAmount]);

  const safeValue = clampSliderAmount(value, maxAmount);
  const display = safeValue > 0 ? String(safeValue) : '';
  const fillPercent = amountToSliderPosition(safeValue, maxAmount) * 100;

  const handleInputChange = (raw: string) => {
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    onChange(clampSliderAmount(parsed, maxAmount));
  };

  const isBounded = maxAmount != null && maxAmount > 0;
  const showTenKMarker = !isBounded || maxAmount > AMOUNT_SLIDER_FINE_MAX;
  const tenKPercent = AMOUNT_SLIDER_FINE_FRACTION * 100;
  const maxLabel = isBounded ? formatSliderAmountLabel(maxAmount) : '$1M';

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 8,
          color: AUTH_THEME.textPrimary,
        }}
      >
        {label}
      </label>

      {helperText ? (
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            lineHeight: 1.45,
            color: AUTH_THEME.textMuted,
            fontWeight: 500,
          }}
        >
          {helperText}
        </p>
      ) : null}

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: AUTH_THEME.textMuted,
            fontWeight: 700,
            zIndex: 1,
          }}
        >
          $
        </span>
        <FormInput
          type="number"
          tone="dark"
          className="font-figure"
          min={0}
          max={scale.max > 0 ? scale.max : undefined}
          value={display}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="0"
          style={{ paddingLeft: 34, fontSize: 20 }}
        />
      </div>

      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 6,
            borderRadius: 999,
            background: AUTH_THEME.progressTrack,
            overflow: 'visible',
          }}
        >
          <div
            style={{
              width: `${fillPercent}%`,
              height: '100%',
              borderRadius: 999,
              background: AUTH_THEME.accent,
              transition: 'width 0.05s ease-out',
            }}
          />
        </div>

        {tickPositions.map((pos, i) => {
          const isTenK =
            showTenKMarker && Math.abs(pos - AMOUNT_SLIDER_FINE_FRACTION) < 0.002;
          return (
            <div
              key={`${pos}-${i}`}
              aria-hidden
              style={{
                position: 'absolute',
                left: `${pos * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 1,
                height: isTenK ? 12 : 7,
                borderRadius: 1,
                background:
                  pos * 100 <= fillPercent + 0.5
                    ? appPrimaryDarkRgba(0.42)
                    : appPrimaryDarkRgba(0.14),
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          );
        })}

        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${fillPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: AUTH_THEME.buttonPrimary,
            border: `2px solid ${AUTH_THEME.accent}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        <input
          id={sliderId}
          type="range"
          min={0}
          max={1000}
          step={1}
          value={amountToSliderStep(safeValue, maxAmount)}
          onChange={(e) => onChange(sliderStepToAmount(Number(e.target.value), maxAmount))}
          aria-label={`${label} slider`}
          aria-valuemin={0}
          aria-valuemax={scale.max}
          aria-valuenow={safeValue}
          className="onboarding-amount-slider-input"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '100%',
            height: 28,
            margin: 0,
            opacity: 0,
            cursor: scale.max > 0 ? 'grab' : 'not-allowed',
            zIndex: 4,
          }}
          disabled={scale.max <= 0}
        />
      </div>

      <div
        className="font-figure"
        style={{
          position: 'relative',
          height: 18,
          marginTop: 8,
          fontSize: 11,
          color: AUTH_THEME.textFaint,
          fontWeight: 600,
        }}
      >
        <span style={{ position: 'absolute', left: 0 }}>$0</span>
        {showTenKMarker ? (
          <span
            style={{
              position: 'absolute',
              left: `${tenKPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            $10k
          </span>
        ) : null}
        <span style={{ position: 'absolute', right: 0 }}>{maxLabel}</span>
      </div>
    </div>
  );
}
