import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { CATEGORIES } from '../../../data/categories';
import { CategoryIcon } from '../../CategoryIcon';
import OnboardingLayout from './OnboardingLayout';

export default function Step5Categories() {
  const navigate = useNavigate();
  const { updateData, next, back, skip, skipAll, onboarding } = useOnboarding();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    onboarding.data.selectedCategories || CATEGORIES.map(c => c.name)
  );

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleNext = () => {
    updateData({
      selectedCategories,
    });
    next('categories');
    navigate('/onboarding/notifications');
  };

  const handleSkipStep = () => {
    skip('categories');
    navigate('/onboarding/notifications');
  };

  const handleBack = () => {
    back();
    navigate('/onboarding/budget');
  };

  const handleSkipAll = () => {
    skipAll();
    navigate('/');
  };

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 8px' }}>
        Choose categories
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
        Tap to select categories to track
      </p>

      {/* Categories list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategories.includes(cat.name);
          return (
            <button
              key={cat.name}
              onClick={() => toggleCategory(cat.name)}
              style={{
                position: 'relative',
                padding: '10px 12px',
                borderRadius: 14,
                border: `2px solid ${isSelected ? '#3E37FF' : '#E5E7EB'}`,
                backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 2px 12px rgba(62,55,255,0.18)' : 'none',
              }}
            >
              <CategoryIcon categoryId={cat.id} size="sm" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', flex: 1 }}>
                {cat.name}
              </span>
              {isSelected && (
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#3E37FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check size={14} color="#FFFFFF" weight="bold" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
