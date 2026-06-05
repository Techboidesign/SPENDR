/**
 * Unit-style checks for parseReceiptText via tsx.
 * Run: npx tsx scripts/test-receipt-parser-logic.mjs
 */
import { parseReceiptText } from '../src/app/utils/parseReceiptText.ts';

const ctx = { expenses: [], allowedCategoryIds: ['groceries', 'dining', 'shopping', 'other'] };

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok  ${name}`);
}

const lidl = parseReceiptText(
  `LIDL\nMilch 1.29\nTOTAL EUR 42.90\nDanke`,
  ctx,
);
assert('LIDL auto-save', lidl.autoSave === true && lidl.item.amount === 42.9);
assert('LIDL merchant', lidl.item.name.toLowerCase().includes('lidl'));

const vague = parseReceiptText(`Shop\n10.00\n20.00\n15.00`, ctx);
assert('ambiguous → review', vague.autoSave === false);

const starbucks = parseReceiptText(
  `Starbucks\nGRAND TOTAL $8.45\n03/12/2026`,
  ctx,
);
assert('Starbucks auto-save', starbucks.autoSave === true && starbucks.item.amount === 8.45);

if (!process.exitCode) {
  console.log('\nAll parser logic tests passed.');
}
