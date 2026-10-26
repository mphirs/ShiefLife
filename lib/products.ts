import * as SQLite from 'expo-sqlite';

export type ShelfProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  reminderDays: number[];
  createdAt: string;
  status: 'active' | 'used' | 'discarded';
  notificationIds?: string[];
};

const db = SQLite.openDatabaseSync('shelflife.db');

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 1,
      expiryDate TEXT NOT NULL,
      reminderDays TEXT,
      createdAt TEXT,
      status TEXT DEFAULT 'active',
      notificationIds TEXT
    );
  `);
}

export async function getProducts(): Promise<ShelfProduct[]> {
  const rows = db.getAllSync('SELECT * FROM products ORDER BY expiryDate ASC');

  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    expiryDate: row.expiryDate,
    reminderDays: row.reminderDays ? JSON.parse(row.reminderDays) : [],
    createdAt: row.createdAt,
    status: row.status,
    notificationIds: row.notificationIds ? JSON.parse(row.notificationIds) : [],
  }));
}

export async function saveProducts(products: ShelfProduct[]) {
  db.execSync('DELETE FROM products');

  const insert = db.prepareSync(`
    INSERT INTO products 
    (id, name, category, quantity, expiryDate, reminderDays, createdAt, status, notificationIds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of products) {
    insert.executeSync([
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.expiryDate,
      JSON.stringify(p.reminderDays || []),
      p.createdAt,
      p.status,
      JSON.stringify(p.notificationIds || []),
    ]);
  }

  insert.finalizeSync();
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function expiryColor(days: number): string {
  if (days < 0) return '#D64545';
  if (days <= 3) return '#E67E22';
  if (days <= 7) return '#F1C40F';
  return '#27AE60';
}

export function expiryLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}