import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { SpendrLogo } from '../../auth/SpendrLogo';
import {
  APP_PRIMARY_DARK,
  APP_PRIMARY_DARK_BRIGHT,
  AUTH_THEME,
  appPrimaryDarkRgba,
} from '../../../theme/authTheme';
import { ONBOARDING_STEPS } from '../../../theme/onboardingSteps';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
  showBack?: boolean;
}

function stepSegmentStyle(stepNumber: number, currentStep: number): React.CSSProperties {
  const isCurrent = stepNumber === currentStep;
  const isCompleted = stepNumber < currentStep;

  if (isCurrent) {
    return {
      height: 7,
      borderRadius: 4,
      backgroundColor: APP_PRIMARY_DARK_BRIGHT,
      boxShadow: `0 0 14px ${appPrimaryDarkRgba(0.65)}`,
    };
  }

  if (isCompleted) {
    return {
      height: 5,
      borderRadius: 4,
      backgroundColor: APP_PRIMARY_DARK,
      opacity: 0.72,
    };
  }

  return {
    height: 5,
    borderRadius: 4,
    backgroundColor: AUTH_THEME.progressTrack,
  };
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  nextDisabled = false,
  showSkip = true,
  showBack = true,
}: OnboardingLayoutProps) {
  const navigate = useNavigate();
  const steps = ONBOARDING_STEPS.slice(0, totalSteps);

  const handleStepClick = (index: number) => {
    const step = steps[index];
    if (!step) return;
    navigate(step.route);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: AUTH_THEME.bgGradient,
        color: AUTH_THEME.textPrimary,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 20px 8px',
          flexShrink: 0,
          gap: 12,
        }}
      >
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: AUTH_THEME.buttonGhost,
              border: `1px solid ${AUTH_THEME.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} color={AUTH_THEME.textPrimary} weight="light" />
          </button>
        ) : null}

        <div style={{ flex: 1, minWidth: 0 }} />

        <SpendrLogo size={36} style={{ flexShrink: 0 }} />
      </div>

      <nav
        aria-label="Onboarding progress"
        style={{ padding: '4px 16px 14px', flexShrink: 0 }}
      >
        <div
          style={{
            display: 'flex',
            gap: 5,
            alignItems: 'flex-end',
          }}
        >
          {steps.map((step, idx) => {
            const stepNumber = idx + 1;
            const isCurrent = stepNumber === currentStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(idx)}
                aria-label={`Step ${stepNumber}`}
                aria-current={isCurrent ? 'step' : undefined}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 2px',
                  margin: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-end',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '100%',
                    transition: 'height 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                    ...stepSegmentStyle(stepNumber, currentStep),
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 20px 20px',
        }}
      >
        {children}
      </div>

      {onNext && (
        <div
          style={{
            flexShrink: 0,
            padding: '12px 20px 28px',
            borderTop: `1px solid ${AUTH_THEME.surfaceBorder}`,
            background: 'rgba(0, 0, 0, 0.12)',
          }}
        >
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: nextDisabled ? AUTH_THEME.progressTrack : AUTH_THEME.buttonPrimary,
              color: nextDisabled ? AUTH_THEME.textFaint : AUTH_THEME.buttonPrimaryText,
              cursor: nextDisabled ? 'not-allowed' : 'pointer',
              borderRadius: 20,
              boxShadow: nextDisabled ? 'none' : '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {nextLabel}
          </Button>

          {showSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: AUTH_THEME.textMuted,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: 0.5,
              }}
            >
              SKIP
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Shared typography for onboarding step content on dark background. */
export const onboardingTitleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: AUTH_THEME.textPrimary,
  margin: '0 0 16px',
  letterSpacing: -0.5,
};

export const onboardingLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: AUTH_THEME.textPrimary,
  marginBottom: 8,
};
