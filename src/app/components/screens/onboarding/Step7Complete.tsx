import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../ui/button';
import { SpendrLogo } from '../../auth/SpendrLogo';
import { AUTH_THEME } from '../../../theme/authTheme';

export default function Step7Complete() {
  const navigate = useNavigate();
  const { complete, back, onboarding } = useOnboarding();
  const { completeOnboardingAndSync } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    back();
    navigate('/onboarding/name-basics');
  };

  const handleLaunch = async () => {
    setLoading(true);
    setError('');
    try {
      complete();
      await completeOnboardingAndSync();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your setup. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = onboarding.data.firstName || 'there';
  const currency = onboarding.data.currency || 'USD';
  const monthlyBudget = onboarding.data.monthlyBudget;
  const selectedCategories = onboarding.data.selectedCategories || [];

  return (
    <div
      style={{
        height: '100%',
        background: AUTH_THEME.bgGradient,
        color: AUTH_THEME.textPrimary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleBack}
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
          }}
        >
          <ArrowLeft size={18} color={AUTH_THEME.textPrimary} weight="light" />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: '0 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ margin: '0 auto 24px', position: 'relative', width: 88, height: 88 }}>
          <SpendrLogo size={88} />
          <div
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: AUTH_THEME.accentMint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={20} color={AUTH_THEME.bgSolid} weight="fill" />
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: '0 0 20px' }}>
          You&apos;re all set, {firstName}!
        </h1>

        {error && (
          <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</p>
        )}

        <div
          style={{
            backgroundColor: AUTH_THEME.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            textAlign: 'left',
            border: `1px solid ${AUTH_THEME.surfaceBorder}`,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Currency</div>
            <div style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5 }}>{currency}</div>
          </div>

          {monthlyBudget != null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Monthly budget</div>
              <div style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5 }}>
                {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                {monthlyBudget.toLocaleString()}
              </div>
            </div>
          )}

          {selectedCategories.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                {selectedCategories.length} categories selected
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleLaunch}
          disabled={loading}
          style={{
            width: '100%',
            height: 50,
            fontSize: 14,
            fontWeight: 700,
            backgroundColor: AUTH_THEME.buttonPrimary,
            color: AUTH_THEME.buttonPrimaryText,
            borderRadius: 20,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving…' : 'Launch Spendr'}
        </Button>

        <p style={{ fontSize: 13, color: AUTH_THEME.textFaint, marginTop: 12, lineHeight: 1.5 }}>
          You can change these later in Settings
        </p>
      </div>
      </div>
    </div>
  );
}
