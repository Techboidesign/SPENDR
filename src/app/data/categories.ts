export interface Category {
  id: string;
  name: string;
  color: string;
  bg: string;
  iconColor?: string; // Darker variant for icons/text/strokes for better contrast
}

export const CATEGORIES: Category[] = [
  { id: 'rent',           name: 'Rent/Housing',     color: '#3E37FF', bg: '#EDEDFF' },
  { id: 'groceries',      name: 'Groceries',         color: '#58CA4E', bg: '#EEFAEC', iconColor: '#2D7A26' },
  { id: 'dining',         name: 'Dining & Drinks',   color: '#8039E3', bg: '#F3EDFD' },
  { id: 'transport',      name: 'Transport',         color: '#62E399', bg: '#F0FCF5', iconColor: '#1F8A4F' },
  { id: 'subscriptions',  name: 'Subscriptions',     color: '#707BFF', bg: '#F0F1FF' },
  { id: 'entertainment',  name: 'Entertainment',     color: '#4B13E8', bg: '#EEEAFD' },
  { id: 'health',         name: 'Health & Fitness',  color: '#F7A54D', bg: '#FEF5EC', iconColor: '#C66F1A' },
  { id: 'shopping',       name: 'Shopping',          color: '#A065FF', bg: '#F7F0FF' },
  { id: 'utilities',      name: 'Utilities',         color: '#0D0D17', bg: '#E8E8EB' },
  { id: 'other',          name: 'Other',             color: '#8B8D9E', bg: '#F2F2F5', iconColor: '#5A5B6B' },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
