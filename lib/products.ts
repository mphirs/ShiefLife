import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'shelflife_products';

export type ShelfProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  reminderDays: number[];
  createdAt: string;
  status: 'active';
  notificationIds?: string[];
};

// Load saved products from the phone.
export async function getProducts(): Promise<ShelfProduct[]> {
  try {
    const savedProducts = await AsyncStorage.getItem(STORAGE_KEY);

    if (!savedProducts) {
      return [];
    }

    return JSON.parse(savedProducts) as ShelfProduct[];
  } catch (error) {
    console.error('Error loading products:', error);
    throw error;
  }
}

// Save products to the phone.
export async function saveProducts(
  products: ShelfProduct[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );
  } catch (error) {
    console.error('Error saving products:', error);
    throw error;
  }
}

// Calculate the number of days until expiry.
export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);
  expiry.setHours(0, 0, 0, 0);

  return Math.round(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// Display a readable expiry message.
export function expiryLabel(expiryDate: string): string {
  const days = daysUntilExpiry(expiryDate);

  if (days < 0) {
    return `Expired ${Math.abs(days)} day(s) ago`;
  }

  if (days === 0) {
    return 'Expires today';
  }

  if (days === 1) {
    return 'Expires tomorrow';
  }

  return `Expires in ${days} days`;
}

// Choose a colour based on expiry status.
export function expiryColor(expiryDate: string): string {
  const days = daysUntilExpiry(expiryDate);

  if (days < 0) {
    return '#DC2626';
  }

  if (days <= 3) {
    return '#EA580C';
  }

  if (days <= 7) {
    return '#CA8A04';
  }

  return '#16A34A';
}