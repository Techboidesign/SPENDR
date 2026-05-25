import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { CATEGORIES } from '../../../data/categories';
import { CategoryIcon } from '../../CategoryIcon';
import OnboardingLayout, { onboardingTitleStyle } from './OnboardingLayout';

/** Short label — matches Settings category pills */
function categoryPillLabel(name: string): string {
  return name.split('/')[0].split(' & ')[0];
}

export default function Step5Categories() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

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
      currentStep={4}
      totalSteps={7}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Choose categories</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategories.includes(cat.name);
          const displayColor = cat.iconColor || cat.color;
          const pillShadow = `0 1px 3px ${displayColor}18`;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => toggleCategory(cat.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: isSelected ? '2px 8px 2px 4px' : '2px 14px 2px 4px',
                borderRadius: 20,
                backgroundColor: cat.bg,
                border: isSelected
                  ? `2px solid ${displayColor}`
                  : `1px solid ${displayColor}20`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: pillShadow,
                opacity: isSelected ? 1 : 0.55,
                transition: 'opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
              }}
            >
              <CategoryIcon categoryId={cat.id} size="xs" />
              <span style={{ fontSize: 11, fontWeight: 500, color: displayColor }}>
                {categoryPillLabel(cat.name)}
              </span>
              {isSelected && (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: displayColor,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <Check size={11} color="#FFFFFF" weight="bold" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
