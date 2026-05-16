import { ReactNode } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../ui/button';

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
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F5F5FA',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        flexShrink: 0,
      }}>
        {showBack && onBack ? (
          <button
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <ArrowLeft size={18} color="#1A1A2E" weight="light" />
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}

        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: idx < currentStep ? '#3E37FF' : '#E5E7EB',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 20px 20px',
      }}>
        {children}
      </div>

      {/* Fixed footer with Next button */}
      {onNext && (
        <div style={{
          flexShrink: 0,
          padding: '12px 20px 28px',
          backgroundColor: '#F5F5FA',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: nextDisabled ? '#E5E7EB' : '#3E37FF',
              color: nextDisabled ? '#9CA3AF' : '#FFFFFF',
              cursor: nextDisabled ? 'not-allowed' : 'pointer',
              borderRadius: 20,
              boxShadow: nextDisabled ? 'none' : '0 4px 14px rgba(62,55,255,0.30)',
            }}
          >
            {nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
