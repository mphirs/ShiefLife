// Barcode -> product. Looks in (1) products you've added before (works offline, and teaches the
// app local brands), then (2) the free Open Food Facts database.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORY_DEFAULT_DAYS, suggestShelfLife } from './shelfLife';

const CACHE_KEY = 'shelflife_barcodes';

export type BarcodeInfo = { name: string; category: string; days: number };

async function readCache(): Promise<Record<string, BarcodeInfo>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Call after the user saves a scanned product, so the same barcode is instant next time. */
export async function rememberBarcode(code: string, info: BarcodeInfo) {
  const cache = await readCache();
  cache[code] = info;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function categoryFromTags(tags: string[]): string {
  const t = tags.join(' ');
  if (/dairies|milks|yogurts|cheeses|butters|eggs|creams/.test(t)) return 'Dairy';
  if (/fruits|vegetables|fresh-plant/.test(t)) return 'Produce';
  if (/meats|fishes|seafood|poultry|sausages/.test(t)) return 'Meat & Fish';
  if (/breads|bakery|pastries|cakes/.test(t)) return 'Bakery';
  if (/beverages|waters|juices|sodas|drinks/.test(t)) return 'Drinks';
  return 'Pantry';
}

export async function lookupBarcode(code: string): Promise<BarcodeInfo | null> {
  const cache = await readCache();
  if (cache[code]) return cache[code];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,categories_tags,quantity`,
      { signal: ctrl.signal },
    );
    const json = await res.json();
    if (json.status !== 1 || !json.product?.product_name) return null;

    const p = json.product;
    const brand = typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : '';
    const name = [brand, p.product_name].filter(Boolean).join(' ').slice(0, 60);
    const category = categoryFromTags(p.categories_tags ?? []);
    const guess = suggestShelfLife(p.product_name);
    const days = guess?.days ?? CATEGORY_DEFAULT_DAYS[category] ?? 30;
    return { name, category: guess?.category ?? category, days };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
