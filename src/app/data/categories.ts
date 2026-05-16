export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  iconColor?: string; // Darker variant for icons/text/strokes for better contrast
}

export const CATEGORIES: Category[] = [
  { id: 'rent',           name: 'Rent/Housing',     emoji: '🏠', color: '#3E37FF', bg: '#EDEDFF' },
  { id: 'groceries',      name: 'Groceries',         emoji: '🛒', color: '#58CA4E', bg: '#EEFAEC', iconColor: '#2D7A26' },
  { id: 'dining',         name: 'Dining & Drinks',   emoji: '🍽️', color: '#8039E3', bg: '#F3EDFD' },
  { id: 'transport',      name: 'Transport',         emoji: '🚗', color: '#62E399', bg: '#F0FCF5', iconColor: '#1F8A4F' },
  { id: 'subscriptions',  name: 'Subscriptions',     emoji: '📱', color: '#707BFF', bg: '#F0F1FF' },
  { id: 'entertainment',  name: 'Entertainment',     emoji: '🎬', color: '#4B13E8', bg: '#EEEAFD' },
  { id: 'health',         name: 'Health & Fitness',  emoji: '💪', color: '#F7A54D', bg: '#FEF5EC', iconColor: '#C66F1A' },
  { id: 'shopping',       name: 'Shopping',          emoji: '🛍️', color: '#A065FF', bg: '#F7F0FF' },
  { id: 'utilities',      name: 'Utilities',         emoji: '⚡', color: '#0D0D17', bg: '#E8E8EB' },
  { id: 'other',          name: 'Other',             emoji: '📦', color: '#8B8D9E', bg: '#F2F2F5', iconColor: '#5A5B6B' },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
