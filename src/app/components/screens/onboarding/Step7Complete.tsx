import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../ui/button';

export default function Step7Complete() {
  const navigate = useNavigate();
  const { complete, onboarding } = useOnboarding();
  const { completeOnboardingAndSync } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div style={{
      height: '100%',
      backgroundColor: '#F5F5FA',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 2px 12px rgba(62,55,255,0.18)',
        }}>
          <CheckCircle size={48} color="#FFFFFF" weight="fill" />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 12px' }}>
          You're all set, {firstName}!
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
          Your account is ready to go
        </p>

        {error && (
          <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</p>
        )}

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          textAlign: 'left',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Currency</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>{currency}</div>
          </div>

          {monthlyBudget != null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>Monthly budget</div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
                {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                {monthlyBudget.toLocaleString()}
              </div>
            </div>
          )}

          {selectedCategories.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>
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
            backgroundColor: '#3E37FF',
            color: '#FFFFFF',
            borderRadius: 14,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving…' : 'Launch Spendr'}
        </Button>

        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12, lineHeight: 1.5 }}>
          You can change these later in Settings
        </p>
      </div>
    </div>
  );
}
