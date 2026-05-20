import { CATEGORIES } from '../data/categories';
import type { ParsedExpenseItem } from '../types/expenseDraft';
import type { ExpenseType } from '../data/types';

const CATEGORY_IDS = CATEGORIES.map(c => c.id);
const VALID_TYPES: ExpenseType[] = ['one-time', 'monthly', 'yearly'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeCategoryId(raw: unknown): string {
  if (typeof raw !== 'string') return 'other';
  const id = raw.toLowerCase().trim();
  if (CATEGORY_IDS.includes(id)) return id;
  const byName = CATEGORIES.find(
    c => c.name.toLowerCase() === id || c.name.toLowerCase().includes(id),
  );
  return byName?.id ?? 'other';
}

function normalizeType(raw: unknown): ExpenseType {
  if (raw === 'monthly' || raw === 'yearly' || raw === 'one-time') return raw;
  return 'one-time';
}

function parseAiJson(text: string): ParsedExpenseItem[] {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const data = JSON.parse(cleaned) as {
    expenses?: Array<Record<string, unknown>>;
  };
  const rows = data.expenses ?? [];
  const out: ParsedExpenseItem[] = [];

  for (const row of rows) {
    const amount = Number(row.amount);
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name || !Number.isFinite(amount) || amount <= 0) continue;
    out.push({
      name: name.slice(0, 120),
      amount: Math.round(amount * 100) / 100,
      date: typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : todayIso(),
      categoryId: normalizeCategoryId(row.categoryId ?? row.category),
      type: normalizeType(row.type),
      notes: typeof row.notes === 'string' ? row.notes.slice(0, 200) : undefined,
    });
  }
  return out;
}

function buildPrompt(): string {
  const catalog = CATEGORIES.map(c => `${c.id}: ${c.name}`).join(', ');
  return `You extract expenses from receipt or bank document images for a personal finance app.
Return ONLY valid JSON: {"expenses":[{"name":"string","amount":number,"date":"YYYY-MM-DD","categoryId":"id","type":"one-time|monthly|yearly","notes":"optional"}]}
Rules:
- Use categoryId from: ${catalog}
- Prefer one-time unless clearly subscription/monthly
- date: use receipt date or today ${todayIso()}
- For multiple line items, return each as separate expenses
- amount is positive number in document currency`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

async function parseWithOpenAI(dataUrl: string): Promise<ParsedExpenseItem[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('NO_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt() },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `AI request failed (${res.status})`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Empty AI response');
  const items = parseAiJson(content);
  if (items.length === 0) throw new Error('No expenses found in document');
  return items;
}

/** Demo parser when no API key — still useful for UX testing. */
function parseWithHeuristics(file: File): ParsedExpenseItem[] {
  const lower = file.name.toLowerCase();
  let categoryId = 'other';
  if (/grocery|rewe|lidl|aldi|market/i.test(lower)) categoryId = 'groceries';
  else if (/uber|fuel|shell|metro|bus/i.test(lower)) categoryId = 'transport';
  else if (/amazon|shop|store/i.test(lower)) categoryId = 'shopping';
  else if (/restaurant|cafe|dining|coffee/i.test(lower)) categoryId = 'dining';

  const amount = 24.5 + Math.round(Math.random() * 80);
  return [
    {
      name: lower.includes('receipt') ? 'Receipt purchase' : file.name.replace(/\.[^.]+$/, '') || 'Scanned expense',
      amount,
      date: todayIso(),
      categoryId,
      type: 'one-time',
      notes: 'Parsed locally (add VITE_OPENAI_API_KEY for full AI)',
    },
  ];
}

export async function parseReceiptImage(file: File): Promise<ParsedExpenseItem[]> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please use a photo (JPG or PNG) for camera scan.');
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (apiKey) {
    const dataUrl = await fileToDataUrl(file);
    return parseWithOpenAI(dataUrl);
  }
  return parseWithHeuristics(file);
}

export async function parseReceiptFiles(files: File[]): Promise<ParsedExpenseItem[]> {
  const images = files.filter(f => f.type.startsWith('image/'));
  if (images.length === 0) {
    throw new Error('Upload a photo of your receipt or statement (PDF support coming soon).');
  }

  const batches = await Promise.all(images.map(f => parseReceiptImage(f)));
  const merged = batches.flat();
  if (merged.length === 0) throw new Error('Could not extract any expenses.');
  return merged;
}
