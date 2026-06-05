const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';
/** Mobile networks + large photos can be slow; hang without this never clears the overlay. */
const OCR_FETCH_TIMEOUT_MS = 45_000;

type OcrSpaceParsedResult = {
  ParsedText?: string | null;
  FileParseExitCode?: number | string;
  ErrorMessage?: string | null;
};

type OcrSpaceResponse = {
  ParsedResults?: OcrSpaceParsedResult[];
  OCRExitCode?: number | string;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | null;
  ErrorDetails?: string | null;
};

function getApiKey(): string {
  const key = import.meta.env.VITE_OCR_SPACE_API_KEY as string | undefined;
  if (!key?.trim()) {
    throw new Error('Add VITE_OCR_SPACE_API_KEY to .env.local for receipt scanning.');
  }
  return key.trim();
}

function getOcrEngine(): '1' | '2' | '3' {
  const raw = (import.meta.env.VITE_OCR_SPACE_ENGINE as string | undefined)?.trim();
  if (raw === '1' || raw === '2' || raw === '3') return raw;
  return '2';
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isSupportedReceiptFile(file: File): boolean {
  return file.type.startsWith('image/') || isPdf(file);
}

/** OCR.space free tier: 1 MB file cap — compress images before calling. */
export async function extractTextWithOcrSpace(file: File): Promise<string> {
  if (!isSupportedReceiptFile(file)) {
    throw new Error('Use a photo (JPG/PNG) or PDF receipt.');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('language', 'eng');
  form.append('isTable', 'true');
  form.append('detectOrientation', 'true');
  form.append('scale', 'true');
  form.append('OCREngine', getOcrEngine());

  if (isPdf(file)) {
    form.append('filetype', 'PDF');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OCR_FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: { apikey: getApiKey() },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OCR timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `OCR request failed (${res.status})`);
  }

  const json = (await res.json()) as OcrSpaceResponse;

  if (json.IsErroredOnProcessing) {
    throw new Error(json.ErrorMessage || json.ErrorDetails || 'OCR could not read this document.');
  }

  const pages = json.ParsedResults ?? [];
  const texts = pages
    .map(page => {
      const code = Number(page.FileParseExitCode);
      if (code !== 1 || !page.ParsedText?.trim()) return '';
      return page.ParsedText.trim();
    })
    .filter(Boolean);

  if (texts.length === 0) {
    throw new Error('No text found on this receipt. Try a clearer photo.');
  }

  return texts.join('\n\n');
}

export { isSupportedReceiptFile, isPdf };
