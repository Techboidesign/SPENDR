import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../context/OnboardingContext';
import { CATEGORIES } from '../../../data/categories';
import { DEFAULT_ICON_BY_CATEGORY_ID, type CategoryIconKey } from '../../../data/categoryConfig';
import type { CustomCategory } from '../../../data/types';
import { CategorySelectPill } from '../../shared/CategorySelectPill';
import { CategoryBulkSelectToggle } from '../../onboarding/CategoryBulkSelectToggle';
import { AddCustomCategoryButton } from '../../settings/AddCustomCategoryButton';
import {
  CategoryEditModal,
  NEW_CATEGORY_ID,
} from '../../settings/CategoryEditModal';
import { ONBOARDING_STEP_COUNT } from '../../../theme/onboardingSteps';
import OnboardingLayout, { useOnboardingTitleStyle } from './OnboardingLayout';

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
  const titleStyle = useOnboardingTitleStyle();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    initialSelectedIds(onboarding.data),
  );
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    () => (onboarding.data.customCategories as CustomCategory[] | undefined) ?? [],
  );
  const [addModalOpen, setAddModalOpen] = useState(false);

  const allBuiltInSelected = selectedCategoryIds.length === CATEGORIES.length;

  const selectedBuiltInSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);

  const additionalCategoriesForIcons = useMemo(() => {
    const builtIn = CATEGORIES.filter(cat => selectedBuiltInSet.has(cat.id)).map(cat => ({
      id: cat.id,
      iconKey: (DEFAULT_ICON_BY_CATEGORY_ID[cat.id] ?? 'package') as CategoryIconKey,
    }));
    const custom = customCategories.map(cat => ({
      id: cat.id,
      iconKey: cat.iconKey as CategoryIconKey,
    }));
    return [...builtIn, ...custom];
  }, [customCategories, selectedBuiltInSet]);

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

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={ONBOARDING_STEP_COUNT}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipAll}
      nextLabel="Continue"
    >
      <h1 style={titleStyle}>Choose categories</h1>

      <div style={{ marginBottom: 14 }}>
        <CategoryBulkSelectToggle
          allSelected={allBuiltInSelected}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATEGORIES.map(cat => (
          <CategorySelectPill
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            bg={cat.bg}
            color={cat.color}
            iconColor={cat.iconColor}
            selected={selectedBuiltInSet.has(cat.id)}
            onSelect={() => toggleCategory(cat.id)}
          />
        ))}
        {customCategories.map(cat => (
          <CategorySelectPill
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            bg={cat.bg}
            color={cat.color}
            iconColor={cat.iconColor}
            selected
            onSelect={() => setCustomCategories(prev => prev.filter(c => c.id !== cat.id))}
          />
        ))}
      </div>

      <AddCustomCategoryButton onClick={() => setAddModalOpen(true)} />

      <CategoryEditModal
        open={addModalOpen}
        categoryId={addModalOpen ? NEW_CATEGORY_ID : null}
        onClose={() => setAddModalOpen(false)}
        onCreateCategory={category => setCustomCategories(prev => [...prev, category])}
        additionalCategories={additionalCategoriesForIcons}
      />
    </OnboardingLayout>
  );
}
