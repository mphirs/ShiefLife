// REPLACES lib/products.ts
// Same storage key as before ('shelflife_products'), so your existing saved products still load.
import { daysBetween, toISODate, todayISO } from './dates';
import { createCollection } from './store';

export type ShelfProduct = {
  id: string;
  updatedAt: number;
  deleted?: boolean;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp (used for the ring's "total shelf life")
  status: 'active';
  price?: number; // total price paid (used for "money saved")
  barcode?: string;
  frozen?: boolean;
  // Business mode
  batchNo?: string;
  supplier?: string;
  unitCost?: number;
  // Legacy fields from the old version
  reminderDays?: number[];
  notificationIds?: string[];
};

export const productsStore = createCollection<ShelfProduct>('shelflife_products');

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getProducts = () => productsStore.list();
export const addProduct = (p: Omit<ShelfProduct, 'updatedAt'>) => productsStore.upsert(p);
export const removeProduct = (id: string) => productsStore.remove(id);

export function daysUntilExpiry(expiryDate: string): number {
  return daysBetween(todayISO(), expiryDate);
}

/** Total shelf life in days (creation -> expiry). Used to size the countdown ring. */
export function shelfTotalDays(p: ShelfProduct): number {
  const c = new Date(p.createdAt || Date.now());
  const createdISO = toISODate(c);
  return Math.max(1, daysBetween(createdISO, p.expiryDate));
}

// NOTE: these two now take the NUMBER OF DAYS (your old index.tsx already called them that way,
// which was a bug because the old versions expected a date string).
export function expiryLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

export function expiryColor(days: number): string {
  if (days < 0) return '#DC2626';
  if (days <= 1) return '#DC2626';
  if (days <= 3) return '#EA580C';
  if (days <= 7) return '#CA8A04';
  return '#16A34A';
}

