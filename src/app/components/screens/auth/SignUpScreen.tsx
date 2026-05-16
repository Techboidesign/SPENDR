import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useOnboarding } from '../../../context/OnboardingContext';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const { setAuth } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = getPasswordStrength(password);

  const handleSignUp = () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and privacy policy');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak');
      return;
    }

    // Mock authentication - in real app, call API
    const userId = 'user_' + Math.random().toString(36).slice(2);
    setAuth({
      isAuthenticated: true,
      userId,
      method: 'email',
    });

    // Navigate to onboarding
    navigate('/onboarding/name-basics');
  };

  const handleSocialSignUp = (method: 'google' | 'apple') => {
    // Mock social auth
    const userId = 'user_' + Math.random().toString(36).slice(2);
    setAuth({
      isAuthenticated: true,
      userId,
      method,
    });
    navigate('/onboarding/name-basics');
  };

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#F5F5FA',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <button
        onClick={() => navigate('/welcome')}
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
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <ArrowLeft size={20} color="#1A1A2E" weight="light" />
      </button>

      <div style={{ width: '100%' }}>
        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 8px' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, margin: '0 0 32px' }}>
          Start tracking your expenses in minutes
        </p>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #EF4444',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 14,
            color: '#EF4444',
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', height: 50, fontSize: 16, borderRadius: 14 }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{ width: '100%', height: 50, fontSize: 16, paddingRight: 48, borderRadius: 14 }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              {showPassword ? <EyeSlash size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: level <= passwordStrength.score ? passwordStrength.color : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 12, color: passwordStrength.color, margin: 0 }}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Terms checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 24,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ width: 20, height: 20, cursor: 'pointer', marginTop: 2 }}
          />
          <span style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
            I agree to the{' '}
            <a href="/settings/privacy" style={{ color: '#3E37FF', textDecoration: 'none' }}>
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/settings/privacy" style={{ color: '#3E37FF', textDecoration: 'none' }}>
              Privacy Policy
            </a>
          </span>
        </label>

        {/* Sign up button */}
        <Button
          onClick={handleSignUp}
          style={{
            width: '100%',
            height: 52,
            fontSize: 16,
            fontWeight: 700,
            backgroundColor: '#3E37FF',
            color: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 4px 14px rgba(62,55,255,0.30)',
            marginBottom: 20,
          }}
        >
          Sign Up
        </Button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          <span style={{ fontSize: 14, color: '#9CA3AF' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Button
            variant="outline"
            onClick={() => handleSocialSignUp('google')}
            style={{ flex: 1, height: 52, fontSize: 16, fontWeight: 700, borderRadius: 20 }}
          >
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignUp('apple')}
            style={{ flex: 1, height: 52, fontSize: 16, fontWeight: 700, borderRadius: 20 }}
          >
            Apple
          </Button>
        </div>

        {/* Log in link */}
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: 0 }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3E37FF',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#E5E7EB' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { score, label: 'Fair', color: '#F59E0B' };
  if (score === 3) return { score, label: 'Good', color: '#10B981' };
  return { score, label: 'Strong', color: '#10B981' };
}
