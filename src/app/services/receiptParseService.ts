import type { Expense } from '../data/types';
import type { ReceiptScanResult } from '../types/expenseDraft';
import { compressImageForOcr } from '../utils/compressImageForOcr';
import { parseReceiptText, type ParseReceiptTextOptions } from '../utils/parseReceiptText';
import { extractTextWithOcrSpace, isSupportedReceiptFile } from './ocrSpaceClient';

export type ReceiptParseContext = ParseReceiptTextOptions;

async function prepareFileForOcr(file: File): Promise<File> {
  if (file.type.startsWith('image/')) {
    return compressImageForOcr(file);
  }
  return file;
}

export async function parseReceiptFile(
  file: File,
  context: ReceiptParseContext,
): Promise<ReceiptScanResult> {
  if (!isSupportedReceiptFile(file)) {
    throw new Error('Use a photo (JPG/PNG) or PDF receipt.');
  }

  const prepared = await prepareFileForOcr(file);
  const text = await extractTextWithOcrSpace(prepared);
  return parseReceiptText(text, context);
}

export async function parseReceiptImage(
  file: File,
  context: ReceiptParseContext,
): Promise<ReceiptScanResult> {
  return parseReceiptFile(file, context);
}

export async function parseReceiptFiles(
  files: File[],
  context: ReceiptParseContext,
): Promise<ReceiptScanResult[]> {
  const supported = files.filter(isSupportedReceiptFile);
  if (supported.length === 0) {
    throw new Error('Upload a photo or PDF of your receipt.');
  }

  const results = await Promise.all(supported.map(file => parseReceiptFile(file, context)));
  if (results.length === 0) {
    throw new Error('Could not extract any expenses from these documents.');
  }
  return results;
}
