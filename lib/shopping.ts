import { Row, createCollection } from './store';

export type ShoppingItem = Row & { name: string; done: boolean };

export const shoppingStore = createCollection<ShoppingItem>('shelflife_shopping');

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function addShoppingItem(name: string) {
  const clean = name.trim();
  if (!clean) return;
  const existing = await shoppingStore.list();
  const dup = existing.find(i => !i.done && i.name.toLowerCase() === clean.toLowerCase());
  if (dup) return;
  await shoppingStore.upsert({ id: newId(), name: clean, done: false });
}

export const toggleShoppingItem = (item: ShoppingItem) =>
  shoppingStore.upsert({ ...item, done: !item.done });

export const removeShoppingItem = (id: string) => shoppingStore.remove(id);

export async function clearBought() {
  const all = await shoppingStore.list();
  for (const i of all.filter(x => x.done)) await shoppingStore.remove(i.id);
}
