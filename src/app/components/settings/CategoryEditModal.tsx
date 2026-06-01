import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { getCategoryById } from '../../data/categories';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_COLOR_PRESETS_BY_HUE,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_ICON_BY_CATEGORY_ID,
  firstAvailableCategoryIconKey,
  getUsedCategoryIconKeys,
  type CategoryIconKey,
} from '../../data/categoryConfig';
import type { CategoryCustomization, CustomCategory } from '../../data/types';
import { createCustomCategoryAppId } from '../../utils/customCategoryId';
import { CategoryIconPreview } from '../CategoryIcon';
import { AppBottomSheetLayout } from '../AppBottomSheetLayout';
import { ModalActionBar } from '../ModalActionBar';

export const NEW_CATEGORY_ID = '__new__';

function findPresetForCategory(color: string, bg: string) {
  return (
    CATEGORY_COLOR_PRESETS.find(p => p.color === color && p.bg === bg)?.id ??
    CATEGORY_COLOR_PRESETS.find(p => p.color === color)?.id ??
    'indigo'
  );
}

export function CategoryEditModal({
  open,
  categoryId,
  onClose,
  /** When set, new categories are passed here instead of dispatching to app state (onboarding). */
  onCreateCategory,
  /** Extra categories not yet in app state (e.g. onboarding custom list). */
  additionalCategories = [],
}: {
  open: boolean;
  categoryId: string | null;
  onClose: () => void;
  onCreateCategory?: (category: CustomCategory) => void;
  additionalCategories?: { id: string; iconKey: CategoryIconKey }[];
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const { state, dispatch, getCategory, categories } = useApp();
  const isNew = categoryId === NEW_CATEGORY_ID;
  const customCategory = categoryId && !isNew
    ? state.customCategories.find(cat => cat.id === categoryId)
    : undefined;
  const isCustom = !!customCategory;
  const base = categoryId && !isNew && !isCustom ? getCategoryById(categoryId) : null;
  const resolved = categoryId && !isNew ? getCategory(categoryId) : null;

  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState<CategoryIconKey>('package');
  const [colorPresetId, setColorPresetId] = useState<string>('indigo');

  const categoriesForIconUse = useMemo(() => {
    const byId = new Map(categories.map(cat => [cat.id, cat]));
    for (const cat of additionalCategories) {
      if (!byId.has(cat.id)) byId.set(cat.id, cat);
    }
    return [...byId.values()];
  }, [categories, additionalCategories]);

  const usedIconKeys = useMemo(
    () => getUsedCategoryIconKeys(categoriesForIconUse, isNew ? null : categoryId),
    [categoriesForIconUse, isNew, categoryId],
  );

  useEffect(() => {
    if (!open || !categoryId) return;

    if (isNew) {
      setName('');
      setColorPresetId('indigo');
      return;
    }

    if (customCategory) {
      setName(customCategory.name);
      setIconKey(customCategory.iconKey as CategoryIconKey);
      setColorPresetId(findPresetForCategory(customCategory.color, customCategory.bg));
      return;
    }

    if (!resolved) return;
    const custom = state.categoryCustomizations[categoryId];
    setName(resolved.name);
    setIconKey(
      (custom?.iconKey as CategoryIconKey) ??
        DEFAULT_ICON_BY_CATEGORY_ID[categoryId] ??
        'package',
    );
    setColorPresetId(findPresetForCategory(resolved.color, resolved.bg));
  }, [open, categoryId, isNew, customCategory, resolved, state.categoryCustomizations]);

  useEffect(() => {
    if (!open || !categoryId || !isNew) return;
    setIconKey(firstAvailableCategoryIconKey(usedIconKeys));
  }, [open, categoryId, isNew, usedIconKeys]);

  if (!open || !categoryId) return null;
  if (!isNew && !isCustom && (!base || !resolved)) return null;

  const preset =
    CATEGORY_COLOR_PRESETS.find(p => p.id === colorPresetId) ?? CATEGORY_COLOR_PRESETS[0];

  const handleSave = () => {
    const categoryName = name.trim() || (isNew ? 'Custom category' : base?.name ?? 'Category');

    if (isNew) {
      const category: CustomCategory = {
        id: createCustomCategoryAppId(),
        name: categoryName,
        iconKey,
        color: preset.color,
        bg: preset.bg,
        iconColor: preset.iconColor,
      };
      if (onCreateCategory) {
        onCreateCategory(category);
      } else {
        dispatch({ type: 'ADD_CUSTOM_CATEGORY', category });
      }
    } else if (isCustom && customCategory) {
      const category: CustomCategory = {
        ...customCategory,
        name: categoryName,
        iconKey,
        color: preset.color,
        bg: preset.bg,
        iconColor: preset.iconColor,
      };
      dispatch({ type: 'UPDATE_CUSTOM_CATEGORY', category });
    } else {
      const customization: CategoryCustomization = {
        name: categoryName,
        iconKey,
        color: preset.color,
        bg: preset.bg,
        iconColor: preset.iconColor,
      };
      dispatch({
        type: 'SET_CATEGORY_CUSTOMIZATION',
        categoryId,
        customization,
      });
    }
    onClose();
  };

  const iconTileBg = isDark ? c.inputBg : '#F7F7FA';
  const mutedLabel = isDark ? c.textMuted : '#6B7280';

  return (
    <AppBottomSheetLayout
      open={open}
      onClose={onClose}
      title={isNew ? 'Add custom category' : 'Edit category'}
      footer={
        <ModalActionBar
          onLeft={onClose}
          leftLabel="CANCEL"
          onSave={handleSave}
          saveLabel="SAVE"
        />
      }
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <CategoryIconPreview
            iconKey={iconKey}
            color={preset.color}
            bg={preset.bg}
            iconColor={preset.iconColor}
            size="md"
          />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Category name"
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 14,
              border: `1px solid ${c.inputBorder}`,
              backgroundColor: c.inputBg,
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: mutedLabel, margin: '0 0 6px' }}>Icon</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 3,
            marginBottom: 12,
          }}
        >
          {CATEGORY_ICON_OPTIONS.map(opt => {
            const selected = iconKey === opt.key;
            const taken = usedIconKeys.has(opt.key);
            const unavailable = taken && !selected;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={unavailable}
                onClick={() => {
                  if (!unavailable) setIconKey(opt.key);
                }}
                aria-label={opt.label}
                aria-pressed={selected}
                aria-disabled={unavailable}
                title={unavailable ? `${opt.label} — already used by another category` : opt.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: 'none',
                  cursor: unavailable ? 'not-allowed' : 'pointer',
                  opacity: unavailable ? 0.38 : 1,
                  backgroundColor: selected ? preset.bg : iconTileBg,
                  boxShadow: selected ? `0 0 0 1px ${preset.color}` : 'none',
                  fontFamily: 'inherit',
                }}
              >
                <Icon
                  size={16}
                  weight={selected ? 'fill' : 'light'}
                  color={
                    unavailable
                      ? c.textFaint
                      : selected
                        ? (preset.iconColor ?? preset.color)
                        : c.textFaint
                  }
                />
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: mutedLabel, margin: '0 0 6px' }}>Color</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 5,
            width: '100%',
          }}
        >
          {CATEGORY_COLOR_PRESETS_BY_HUE.map(p => {
            const selected = colorPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setColorPresetId(p.id)}
                aria-label={p.id}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: p.color,
                  boxShadow: selected
                    ? `0 0 0 1px ${c.modalSheet}, 0 0 0 1px ${p.color}`
                    : isDark
                      ? `0 0 0 1px ${c.border}`
                      : '0 1px 3px rgba(0,0,0,0.08)',
                  transform: selected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              />
            );
          })}
        </div>
    </AppBottomSheetLayout>
  );
}
