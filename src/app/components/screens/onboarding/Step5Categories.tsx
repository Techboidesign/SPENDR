import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from '@phosphor-icons/react';
import { useOnboarding } from '../../../context/OnboardingContext';
import { CATEGORIES } from '../../../data/categories';
import type { CustomCategory } from '../../../data/types';
import { CategoryIcon } from '../../CategoryIcon';
import { CategoryBulkSelectToggle } from '../../onboarding/CategoryBulkSelectToggle';
import { AddCustomCategoryButton } from '../../settings/AddCustomCategoryButton';
import {
  CategoryEditModal,
  NEW_CATEGORY_ID,
} from '../../settings/CategoryEditModal';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { onboardingTitleStyle } from './OnboardingLayout';

/** Short label — matches Settings category pills */
function categoryPillLabel(name: string): string {
  return name.split('/')[0].split(' & ')[0];
}

function initialSelectedIds(
  data: ReturnType<typeof useOnboarding>['onboarding']['data'],
): string[] {
  if (data.selectedCategoryIds?.length) return data.selectedCategoryIds;
  if (data.selectedCategories?.length) {
    return data.selectedCategories
      .map(name => CATEGORIES.find(c => c.name === name)?.id)
      .filter((id): id is string => Boolean(id));
  }
  return CATEGORIES.map(c => c.id);
}

export default function Step5Categories() {
  const navigate = useNavigate();
  const { updateData, next, back, skipAll, onboarding } = useOnboarding();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    initialSelectedIds(onboarding.data),
  );
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    () => (onboarding.data.customCategories as CustomCategory[] | undefined) ?? [],
  );
  const [addModalOpen, setAddModalOpen] = useState(false);

  const allBuiltInSelected = selectedCategoryIds.length === CATEGORIES.length;

  const selectedBuiltInSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId],
    );
  };

  const handleSelectAll = () => setSelectedCategoryIds(CATEGORIES.map(c => c.id));
  const handleDeselectAll = () => setSelectedCategoryIds([]);

  const handleNext = () => {
    updateData({
      selectedCategoryIds,
      customCategories,
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

  const renderPill = (
    key: string,
    categoryId: string,
    name: string,
    bg: string,
    color: string,
    iconColor: string | undefined,
    isSelected: boolean,
    onToggle: () => void,
  ) => {
    const displayColor = iconColor || color;
    const pillShadow = `0 1px 3px ${displayColor}18`;

    return (
      <button
        key={key}
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: isSelected ? '2px 8px 2px 4px' : '2px 14px 2px 4px',
          borderRadius: 20,
          backgroundColor: bg,
          border: isSelected ? `2px solid ${displayColor}` : `1px solid ${displayColor}20`,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: pillShadow,
          opacity: isSelected ? 1 : 0.55,
          transition: 'opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        }}
      >
        <CategoryIcon categoryId={categoryId} size="xs" />
        <span style={{ fontSize: 11, fontWeight: 500, color: displayColor }}>{categoryPillLabel(name)}</span>
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
  };

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={onboardingTitleStyle}>Choose categories</h1>

      <div style={{ marginBottom: 14 }}>
        <CategoryBulkSelectToggle
          allSelected={allBuiltInSelected}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATEGORIES.map(cat =>
          renderPill(
            cat.id,
            cat.id,
            cat.name,
            cat.bg,
            cat.color,
            cat.iconColor,
            selectedBuiltInSet.has(cat.id),
            () => toggleCategory(cat.id),
          ),
        )}
        {customCategories.map(cat =>
          renderPill(
            cat.id,
            cat.id,
            cat.name,
            cat.bg,
            cat.color,
            cat.iconColor,
            true,
            () => setCustomCategories(prev => prev.filter(c => c.id !== cat.id)),
          ),
        )}
      </div>

      <AddCustomCategoryButton onDarkSurface onClick={() => setAddModalOpen(true)} />

      <CategoryEditModal
        open={addModalOpen}
        categoryId={addModalOpen ? NEW_CATEGORY_ID : null}
        onClose={() => setAddModalOpen(false)}
        onCreateCategory={category => setCustomCategories(prev => [...prev, category])}
      />
    </OnboardingLayout>
  );
}
