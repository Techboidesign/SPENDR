import type { ExpenseType } from '../data/types';
import type { ParsedExpenseItem, ReceiptScanResult } from '../types/expenseDraft';
import { suggestCategoryFromNameWithExpenses } from './suggestCategoryFromName';
import type { Expense } from '../data/types';

const TOTAL_LABEL =
  /\b(grand\s+total|amount\s+due|total\s+due|balance\s+due|to\s+pay|total\s+amount|total|summe|gesamt|totale|importe\s+total)\b/i;
const SUBTOTAL_LABEL = /\b(sub\s*total|subtotal|zwischensumme|net\s+amount)\b/i;
const DATE_PATTERNS = [
  /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
  /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/,
  /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})\b/i,
];

const NOISE_LINE =
  /\b(thank\s+you|visa|mastercard|card|auth|approval|change|cashier|tel|phone|www\.|http|vat\s*no|tax\s*id|receipt\s*#|invoice\s*#)\b/i;
const ADDRESS_LINE = /\b(street|st\.|road|rd\.|avenue|ave\.|blvd|zip|postal|\d{5}(?:-\d{4})?)\b/i;

type AmountHit = {
  amount: number;
  lineIndex: number;
  line: string;
  hasTotalLabel: boolean;
  hasSubtotalLabel: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseAmountToken(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/,/g, '.');
  const match = cleaned.match(/(\d+\.\d{2}|\d+\.\d{1}|\d+)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0 || value > 99_999) return null;
  return Math.round(value * 100) / 100;
}

function extractAmountsFromLine(line: string): number[] {
  const hits: number[] = [];
  const patterns = [
    /(?:€|EUR|\$|USD|£|GBP)\s*([\d.,]+)/gi,
    /([\d.,]+)\s*(?:€|EUR|\$|USD|£|GBP)/gi,
    /(?<![\d.])(\d{1,6}\.\d{2})(?!\d)/g,
    /(?<![\d.])(\d{1,6},\d{2})(?!\d)/g,
  ];

  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern)) {
      const amount = parseAmountToken(match[1] ?? match[0]);
      if (amount != null) hits.push(amount);
    }
  }

  return [...new Set(hits)];
}

function parseDateFromText(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    if (pattern.source.startsWith('\\b(\\d{4})')) {
      const y = Number(match[1]);
      const m = Number(match[2]);
      const d = Number(match[3]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    if (pattern.source.includes('jan|feb')) {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const d = Number(match[1]);
      const monthIdx = months.findIndex(m => match[2].toLowerCase().startsWith(m));
      let y = Number(match[3]);
      if (y < 100) y += 2000;
      if (monthIdx >= 0 && d >= 1 && d <= 31) {
        return `${y}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const a = Number(match[1]);
    const b = Number(match[2]);
    let y = Number(match[3]);
    if (y < 100) y += 2000;

    let month = a;
    let day = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && y >= 2000 && y <= 2100) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

function isMerchantCandidate(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 72) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (extractAmountsFromLine(trimmed).length > 0 && trimmed.length < 24) return false;
  if (NOISE_LINE.test(trimmed)) return false;
  if (ADDRESS_LINE.test(trimmed)) return false;
  if (DATE_PATTERNS.some(p => p.test(trimmed))) return false;
  return true;
}

function pickMerchant(lines: string[]): string {
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    if (isMerchantCandidate(line)) {
      return line.slice(0, 120);
    }
  }
  return 'Receipt purchase';
}

function lineHasTotalLabel(line: string): boolean {
  return TOTAL_LABEL.test(line) && !SUBTOTAL_LABEL.test(line);
}

function collectAmountHits(lines: string[]): AmountHit[] {
  const hits: AmountHit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasTotalLabel = lineHasTotalLabel(line);
    const hasSubtotalLabel = SUBTOTAL_LABEL.test(line);
    const amountsOnLine = extractAmountsFromLine(line);

    if (amountsOnLine.length > 0) {
      for (const amount of amountsOnLine) {
        hits.push({
          amount,
          lineIndex: i,
          line,
          hasTotalLabel,
          hasSubtotalLabel,
        });
      }
      continue;
    }

    // TOTAL on its own line — amount often on the next line
    if (hasTotalLabel && i + 1 < lines.length) {
      const nextAmounts = extractAmountsFromLine(lines[i + 1]);
      for (const amount of nextAmounts) {
        hits.push({
          amount,
          lineIndex: i + 1,
          line: `${line} ${lines[i + 1]}`,
          hasTotalLabel: true,
          hasSubtotalLabel: false,
        });
      }
    }
  }

  return hits;
}

function pickTotalAmount(
  hits: AmountHit[],
  lineCount: number,
): { amount: number; confident: boolean; labeled: boolean } | null {
  const labeled = hits.filter(h => h.hasTotalLabel && !h.hasSubtotalLabel);
  if (labeled.length === 1) {
    return { amount: labeled[0].amount, confident: true, labeled: true };
  }

  if (labeled.length > 1) {
    const byAmount = new Map<number, number>();
    for (const hit of labeled) {
      byAmount.set(hit.amount, (byAmount.get(hit.amount) ?? 0) + 1);
    }
    const sorted = [...byAmount.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 1 || sorted[0][1] > sorted[1][1]) {
      return { amount: sorted[0][0], confident: true, labeled: true };
    }
    return null;
  }

  const nonSubtotal = hits.filter(h => !h.hasSubtotalLabel);
  if (nonSubtotal.length === 0) return null;

  const max = nonSubtotal.reduce((best, hit) => (hit.amount > best.amount ? hit : best), nonSubtotal[0]);
  const maxCount = nonSubtotal.filter(h => h.amount === max.amount).length;
  if (maxCount > 1) return null;

  const inBottomHalf = lineCount > 0 && max.lineIndex >= Math.floor(lineCount / 2);
  return {
    amount: max.amount,
    confident: inBottomHalf && max.amount >= 1,
    labeled: false,
  };
}

export type ParseReceiptTextOptions = {
  allowedCategoryIds: readonly string[];
  expenses: Expense[];
  catalogNames?: readonly { id: string; name: string }[];
};

/**
 * One expense per receipt. `autoSave` when total + merchant are trustworthy.
 */
export function parseReceiptText(
  rawText: string,
  options: ParseReceiptTextOptions,
): ReceiptScanResult {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const amountHits = collectAmountHits(lines);
  const totalPick = pickTotalAmount(amountHits, lines.length);
  const merchant = pickMerchant(lines);
  const date = parseDateFromText(rawText) ?? todayIso();

  const categoryId =
    suggestCategoryFromNameWithExpenses(
      merchant,
      options.expenses,
      options.allowedCategoryIds,
      options.catalogNames,
    ) ?? 'other';

  const amount = totalPick?.amount ?? 0;
  const type: ExpenseType = 'one-time';

  const item: ParsedExpenseItem = {
    name: merchant,
    amount,
    date,
    categoryId,
    type,
  };

  const autoSave =
    totalPick != null &&
    totalPick.labeled &&
    totalPick.confident &&
    amount >= 0.01 &&
    merchant.length >= 2 &&
    merchant !== 'Receipt purchase';

  return { item, autoSave };
}
