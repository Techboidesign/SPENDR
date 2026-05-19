import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { FormInput } from '../../shared/FormFields';
import { useOnboarding } from '../../../context/OnboardingContext';

export default function LogInScreen() {
  const navigate = useNavigate();
  const { setAuth, onboarding } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogIn = () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Mock authentication - in real app, call API
    const userId = 'user_' + Math.random().toString(36).slice(2);
    setAuth({
      isAuthenticated: true,
      userId,
      method: 'email',
    });

    // Navigate based on onboarding status
    if (onboarding.status === 'completed' || onboarding.status === 'skipped') {
      navigate('/');
    } else if (onboarding.status === 'in_progress' && onboarding.lastStepId) {
      navigate(`/onboarding/${onboarding.lastStepId}`);
    } else {
      navigate('/onboarding/name-basics');
    }
  };

  const handleSocialLogIn = (method: 'google' | 'apple') => {
    // Mock social auth
    const userId = 'user_' + Math.random().toString(36).slice(2);
    setAuth({
      isAuthenticated: true,
      userId,
      method,
    });

    // Navigate based on onboarding status
    if (onboarding.status === 'completed' || onboarding.status === 'skipped') {
      navigate('/');
    } else {
      navigate('/onboarding/name-basics');
    }
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
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, margin: '0 0 32px' }}>
          Log in to your account to continue
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
          <FormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <FormInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ paddingRight: 48 }}
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
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3E37FF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Log in button */}
        <Button
          onClick={handleLogIn}
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
          Log In
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
            onClick={() => handleSocialLogIn('google')}
            style={{ flex: 1, height: 52, fontSize: 16, fontWeight: 700, borderRadius: 20 }}
          >
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogIn('apple')}
            style={{ flex: 1, height: 52, fontSize: 16, fontWeight: 700, borderRadius: 20 }}
          >
            Apple
          </Button>
        </div>

        {/* Sign up link */}
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: 0 }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
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
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
