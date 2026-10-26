// Receipt scanning = photo -> OCR text -> list of grocery lines.
// OCR uses the OCR.space API (free tier). Put your own key in .env:
//   EXPO_PUBLIC_OCR_SPACE_KEY=your_key
// ('helloworld' is OCR.space's public demo key; fine for testing only.)
// For production, call OCR from your own backend so the key isn't inside the app.
import { CATEGORY_DEFAULT_DAYS, suggestShelfLife } from './shelfLife';

const OCR_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_KEY || 'helloworld';

export async function ocrReceipt(base64: string): Promise<string> {
  const body = new FormData();
  body.append('base64Image', `data:image/jpeg;base64,${base64}`);
  body.append('apikey', OCR_KEY);
  body.append('OCREngine', '2');
  body.append('isTable', 'true');
  body.append('scale', 'true');

  const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body });
  const json = await res.json();
  if (json.IsErroredOnProcessing) {
    throw new Error(String(json.ErrorMessage?.[0] ?? 'OCR failed'));
  }
  return json.ParsedResults?.[0]?.ParsedText ?? '';
}

export type ReceiptItem = {
  key: string;
  name: string;
  quantity: number;
  price?: number;
  category: string;
  days: number;
  include: boolean;
};

const SKIP = /(total|subtotal|sub-total|change|cash|vat|tax|tel|phone|thank|receipt|invoice|balance|amount|card|visa|mastercard|date|time|cashier|till|tin\b|discount|rounding|tendered|served|welcome|www|\.com)/i;

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function parseReceiptText(text: string): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((raw, idx) => {
    let line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 4 || SKIP.test(line)) return;

    // price at the end of the line, e.g. "MILK 1L   2,450.00" or "BREAD 1200"
    const m = line.match(/(\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*[A-Za-z]?$/);
    let price: number | undefined;
    if (m) {
      price = Number(m[1].replace(/[,\s]/g, ''));
      line = line.slice(0, m.index).trim();
    }

    let quantity = 1;
    const q = line.match(/^(\d{1,2})\s*[xX*]\s*/);
    if (q) {
      quantity = Number(q[1]);
      line = line.slice(q[0].length);
    }

    line = line.replace(/^\d{5,}\s*/, '').replace(/[^A-Za-z0-9 &'\-./%]/g, ' ').replace(/\s+/g, ' ').trim();
    if ((line.match(/[A-Za-z]/g) ?? []).length < 3) return;

    const guess = suggestShelfLife(line);
    // Lines with no price are only kept if we recognise the food (skips shop names / addresses).
    if (price === undefined && !guess) return;
    const category = guess?.category ?? 'Pantry';
    items.push({
      key: `${idx}-${line}`,
      name: titleCase(line).slice(0, 50),
      quantity,
      price,
      category,
      days: guess?.days ?? CATEGORY_DEFAULT_DAYS[category] ?? 30,
      include: true,
    });
  });
  return items;
}
