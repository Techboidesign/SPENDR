const MAX_OCR_BYTES = 900_000;
const MAX_EDGE = 2200;

/**
 * Keeps camera photos under OCR.space free-tier 1 MB limit.
 * Returns the original file when already small enough or not an image.
 */
export async function compressImageForOcr(file: File, maxBytes = MAX_OCR_BYTES): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= maxBytes) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const quality = mime === 'image/jpeg' ? 0.82 : undefined;

  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, mime, quality);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const base = file.name.replace(/\.[^.]+$/, '') || 'receipt';
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  return new File([blob], `${base}-ocr.${ext}`, { type: mime, lastModified: file.lastModified });
}
