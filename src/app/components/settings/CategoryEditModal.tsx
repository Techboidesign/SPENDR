import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { getCategoryById } from '../../data/categories';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_COLOR_PRESETS_BY_HUE,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_ICON_BY_CATEGORY_ID,
  type CategoryIconKey,
} from '../../data/categoryConfig';
import type { CategoryCustomization, CustomCategory } from '../../data/types';
import { CategoryIconPreview } from '../CategoryIcon';
import { BottomSheetModal } from '../BottomSheetModal';
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
}: {
  open: boolean;
  categoryId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch, getCategory } = useApp();
  const isNew = categoryId === NEW_CATEGORY_ID;
  const customCategory = categoryId && !isNew
    ? state.customCategories.find(c => c.id === categoryId)
    : undefined;
  const isCustom = !!customCategory;
  const base = categoryId && !isNew && !isCustom ? getCategoryById(categoryId) : null;
  const resolved = categoryId && !isNew ? getCategory(categoryId) : null;

  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState<CategoryIconKey>('package');
  const [colorPresetId, setColorPresetId] = useState<string>('indigo');

  useEffect(() => {
    if (!open || !categoryId) return;

    if (isNew) {
      setName('');
      setIconKey('package');
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

  if (!open || !categoryId) return null;
  if (!isNew && !isCustom && (!base || !resolved)) return null;

  const preset =
    CATEGORY_COLOR_PRESETS.find(p => p.id === colorPresetId) ?? CATEGORY_COLOR_PRESETS[0];

  const handleSave = () => {
    const categoryName = name.trim() || (isNew ? 'New category' : base?.name ?? 'Category');

    if (isNew) {
      const category: CustomCategory = {
        id: `custom-${Date.now()}`,
        name: categoryName,
        iconKey,
        color: preset.color,
        bg: preset.bg,
        iconColor: preset.iconColor,
      };
      dispatch({ type: 'ADD_CUSTOM_CATEGORY', category });
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

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      sheetStyle={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px 24px 0 0',
        padding: 0,
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
          {isNew ? 'Add category' : 'Edit category'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#F7F7FA',
            border: 'none',
            borderRadius: 10,
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} weight="bold" color="#6B7280" />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
            padding: '14px 16px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: '#F7F7FA',
            fontSize: 16,
            fontWeight: 600,
            color: '#1A1A2E',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: '0 0 10px' }}>Icon</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: 4,
          marginBottom: 20,
        }}
      >
        {CATEGORY_ICON_OPTIONS.map(opt => {
          const selected = iconKey === opt.key;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setIconKey(opt.key)}
              aria-label={opt.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
                aspectRatio: '1',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selected ? preset.bg : '#F7F7FA',
                boxShadow: selected ? `0 0 0 2px ${preset.color}` : 'none',
                fontFamily: 'inherit',
              }}
            >
              <Icon
                size={18}
                weight={selected ? 'fill' : 'light'}
                color={selected ? preset.iconColor ?? preset.color : '#9CA3AF'}
              />
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: '0 0 10px' }}>Color</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 6,
          width: '100%',
          marginBottom: 16,
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
                  ? `0 0 0 2px #FFFFFF, 0 0 0 3px ${p.color}`
                  : '0 1px 3px rgba(0,0,0,0.08)',
                transform: selected ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            />
          );
        })}
      </div>

      </div>

      <ModalActionBar
        onLeft={onClose}
        leftLabel="CANCEL"
        onSave={handleSave}
        saveLabel="SAVE"
      />
    </BottomSheetModal>
  );
}
