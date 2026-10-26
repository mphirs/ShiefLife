// Quick actions: Used / Thrown out / Frozen / Delete. Each one logs an event (for stats),
// updates the shelf, and rebuilds the reminders.
import { addDays, todayISO } from './dates';
import { eventsStore } from './events';
import { cancelExpiryReminders, refreshReminders } from './notifications';
import { ShelfProduct, daysUntilExpiry, newId, productsStore, removeProduct } from './products';
import { getSettings } from './settings';
import { frozenExtension } from './shelfLife';

async function log(p: ShelfProduct, action: 'used' | 'thrown' | 'frozen', value: number, before: boolean) {
  await eventsStore.upsert({
    id: newId(),
    productId: p.id,
    name: p.name,
    category: p.category,
    action,
    value,
    beforeExpiry: before,
    at: new Date().toISOString(),
  });
}

async function valueOf(p: ShelfProduct) {
  return p.price ?? (await getSettings()).avgItemValue;
}

export async function markUsed(p: ShelfProduct) {
  const beforeExpiry = daysUntilExpiry(p.expiryDate) >= 0;
  await log(p, 'used', await valueOf(p), beforeExpiry);
  await removeProduct(p.id);
  await cancelExpiryReminders(p.notificationIds);
  await refreshReminders();
  return { beforeExpiry };
}

export async function markThrown(p: ShelfProduct) {
  await log(p, 'thrown', await valueOf(p), daysUntilExpiry(p.expiryDate) >= 0);
  await removeProduct(p.id);
  await cancelExpiryReminders(p.notificationIds);
  await refreshReminders();
}

/** Freezing extends the date by a category-specific number of days and refills the ring. */
export async function freezeProduct(p: ShelfProduct) {
  const days = daysUntilExpiry(p.expiryDate);
  const start = days > 0 ? p.expiryDate : todayISO();
  const extra = frozenExtension(p.category);
  await productsStore.upsert({
    ...p,
    expiryDate: addDays(start, extra),
    frozen: true,
    createdAt: new Date().toISOString(),
  });
  await log(p, 'frozen', 0, days >= 0);
  await refreshReminders();
  return extra;
}

export async function deleteProduct(p: ShelfProduct) {
  await removeProduct(p.id);
  await cancelExpiryReminders(p.notificationIds);
  await refreshReminders();
}

export async function restoreProduct(p: ShelfProduct) {
  await productsStore.upsert({ ...p, deleted: false });
  await refreshReminders();
}

