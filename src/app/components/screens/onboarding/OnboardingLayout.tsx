import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { SpendrLogo } from '../../auth/SpendrLogo';
import { useOnboardingChrome } from '../../../context/OnboardingThemeContext';
import { ONBOARDING_STEPS } from '../../../theme/onboardingSteps';
import {
  onboardingLabelStyle,
  onboardingStepSegmentStyle,
  onboardingTitleStyle,
} from '../../../theme/onboardingUi';

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
  const { theme, isLight } = useOnboardingChrome();
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
        background: theme.bgGradient,
        color: theme.textPrimary,
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
              backgroundColor: theme.buttonGhost,
              border: `1px solid ${theme.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} color={theme.textPrimary} weight="light" />
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
                    transition:
                      'height 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
                    ...onboardingStepSegmentStyle(stepNumber, currentStep, theme, isLight),
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
            borderTop: `1px solid ${theme.surfaceBorder}`,
            background: theme.footerBg,
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
              backgroundColor: nextDisabled ? theme.progressTrack : theme.buttonPrimary,
              color: nextDisabled ? theme.textFaint : theme.buttonPrimaryText,
              cursor: nextDisabled ? 'not-allowed' : 'pointer',
              borderRadius: 20,
              boxShadow: nextDisabled
                ? 'none'
                : isLight
                  ? '0 4px 20px rgba(62, 55, 255, 0.25)'
                  : '0 4px 20px rgba(0,0,0,0.25)',
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
                color: theme.textMuted,
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

export function useOnboardingTitleStyle() {
  const { theme } = useOnboardingChrome();
  return onboardingTitleStyle(theme);
}

export function useOnboardingLabelStyle() {
  const { theme } = useOnboardingChrome();
  return onboardingLabelStyle(theme);
}
