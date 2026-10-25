
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ShelfProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  reminderDays: number[];
  createdAt: string;
  status: 'active' | 'used' | 'sold' | 'discarded';
  notificationIds?: string[];
};

const STORAGE_KEY = '@shelflife/products';

export async function getProducts(): Promise<ShelfProduct[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as ShelfProduct[] : [];
  } catch (error) {
    console.error('Could not load products:', error);
    return [];
  }
}

export async function saveProducts(
  products: ShelfProduct[],
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function daysUntilExpiry(expiryDate: string): number {
  const [year, month, day] = expiryDate.split('-').map(Number);

  const expiry = Date.UTC(year, month - 1, day);
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.round((expiry - todayUtc) / 86_400_000);
}

export function expiryLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days remaining`;
}

export function expiryColor(days: number): string {
  if (days < 0) return '#B42318';
  if (days <= 2) return '#D97706';
  if (days <= 7) return '#A66B08';
  return '#218653';
}
