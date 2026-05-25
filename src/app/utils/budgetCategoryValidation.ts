/** Validates a single category limit input. */
export function getCategoryBudgetLimitError(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) {
    return 'Enter a valid amount (0 or more).';
  }
  return null;
}
