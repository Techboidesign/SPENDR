import { useId, useMemo } from 'react';
import { useOnboardingChrome } from '../../context/OnboardingThemeContext';
import { APP_PRIMARY } from '../../theme/authTheme';
import { hexToRgba } from '../../theme/onboardingUi';
import { CurrencyAmountInput } from '../shared/CurrencyAmountInput';
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
  currencySymbol?: string;
};

export function OnboardingAmountField({
  label,
  value,
  onChange,
  maxAmount,
  helperText,
  currencySymbol = '$',
}: OnboardingAmountFieldProps) {
  const { theme, isLight } = useOnboardingChrome();
  const sliderId = useId();
  const scale = resolveAmountSliderScale(maxAmount);
  const tickPositions = useMemo(() => buildSliderTickPositions(maxAmount), [maxAmount]);

  const safeValue = clampSliderAmount(value, maxAmount);
  const display = safeValue > 0 ? String(safeValue) : '';
  const fillPercent = amountToSliderPosition(safeValue, maxAmount) * 100;

  const tickActive = isLight ? hexToRgba(APP_PRIMARY, 0.42) : hexToRgba(APP_PRIMARY, 0.42);
  const tickInactive = isLight ? hexToRgba(APP_PRIMARY, 0.14) : hexToRgba(APP_PRIMARY, 0.14);
  const thumbShadow = isLight ? '0 2px 8px rgba(62, 55, 255, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.35)';

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
          color: theme.textPrimary,
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
            color: theme.textMuted,
            fontWeight: 500,
          }}
        >
          {helperText}
        </p>
      ) : null}

      <div style={{ marginBottom: 14 }}>
        <CurrencyAmountInput
          currencySymbol={currencySymbol}
          type="number"
          tone="light"
          className="font-figure"
          min={0}
          max={scale.max > 0 ? scale.max : undefined}
          value={display}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="0"
          style={{ fontSize: 20 }}
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
            background: theme.progressTrack,
            overflow: 'visible',
          }}
        >
          <div
            style={{
              width: `${fillPercent}%`,
              height: '100%',
              borderRadius: 999,
              background: theme.accent,
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
                background: pos * 100 <= fillPercent + 0.5 ? tickActive : tickInactive,
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
            background: isLight ? '#FFFFFF' : theme.buttonPrimary,
            border: `1px solid ${theme.accent}`,
            boxShadow: thumbShadow,
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
          color: theme.textFaint,
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
