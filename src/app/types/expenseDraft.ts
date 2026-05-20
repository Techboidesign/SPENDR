import type { ExpenseType } from '../data/types';

/** Pre-fill values for the add-expense sheet (from AI scan or upload). */
export type ExpenseFormDraft = {
  amount?: string;
  name?: string;
  categoryId?: string;
  date?: string;
  type?: ExpenseType;
  notes?: string;
  startDate?: string;
  endDate?: string;
};

export type ParsedExpenseItem = {
  name: string;
  amount: number;
  date: string;
  categoryId: string;
  type: ExpenseType;
  notes?: string;
};
