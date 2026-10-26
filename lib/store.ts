// A tiny offline-first store on top of AsyncStorage.
// Every row has an id + updatedAt, so two phones (household sharing) can be merged safely:
// the newest version of each row wins. Deleted rows are kept as "tombstones" for 30 days.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type Row = { id: string; updatedAt: number; deleted?: boolean };

export interface Collection<T extends Row> {
  key: string;
  raw(): Promise<T[]>;
  list(): Promise<T[]>;
  upsert(item: Omit<T, 'updatedAt'>): Promise<T>;
  remove(id: string): Promise<void>;
  mergeRemote(remote: T[]): Promise<void>;
  subscribe(fn: () => void): () => void;
  onLocalWrite(fn: (rows: T[]) => void): () => void;
}

export function mergeById<T extends Row>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of [...a, ...b]) {
    const cur = map.get(r.id);
    if (!cur || r.updatedAt > cur.updatedAt) map.set(r.id, r);
  }
  const cutoff = Date.now() - 30 * 86400000;
  return [...map.values()].filter(r => !(r.deleted && r.updatedAt < cutoff));
}

export function createCollection<T extends Row>(key: string): Collection<T> {
  const listeners = new Set<() => void>();
  const localListeners = new Set<(rows: T[]) => void>();
  let chain: Promise<unknown> = Promise.resolve();

  // Run writes one after another so they never overwrite each other.
  function enqueue<R>(fn: () => Promise<R>): Promise<R> {
    const p = chain.then(fn);
    chain = p.catch(() => undefined);
    return p;
  }

  async function raw(): Promise<T[]> {
    try {
      const s = await AsyncStorage.getItem(key);
      const rows: T[] = s ? JSON.parse(s) : [];
      // Older app versions saved rows without updatedAt.
      return rows.map(r => ({ ...r, updatedAt: r.updatedAt ?? 0 }));
    } catch {
      return [];
    }
  }

  async function writeRaw(rows: T[], fromRemote = false) {
    await AsyncStorage.setItem(key, JSON.stringify(rows));
    listeners.forEach(l => l());
    if (!fromRemote) localListeners.forEach(l => l(rows));
  }

  return {
    key,
    raw,
    async list() {
      return (await raw()).filter(r => !r.deleted);
    },
    upsert(item) {
      return enqueue(async () => {
        const rows = await raw();
        const next = { ...item, updatedAt: Date.now() } as T;
        const i = rows.findIndex(r => r.id === next.id);
        if (i >= 0) rows[i] = next;
        else rows.push(next);
        await writeRaw(rows);
        return next;
      });
    },
    remove(id) {
      return enqueue(async () => {
        const rows = await raw();
        const i = rows.findIndex(r => r.id === id);
        if (i < 0) return;
        rows[i] = { ...rows[i], deleted: true, updatedAt: Date.now() };
        await writeRaw(rows);
      });
    },
    mergeRemote(remote) {
      return enqueue(async () => {
        await writeRaw(mergeById(await raw(), remote), true);
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    onLocalWrite(fn) {
      localListeners.add(fn);
      return () => {
        localListeners.delete(fn);
      };
    },
  };
}

/** React hook: always returns the live, non-deleted rows of a collection. */
export function useList<T extends Row>(store: Collection<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setItems(await store.list());
    setLoading(false);
  }, [store]);

  useEffect(() => {
    load();
    return store.subscribe(load);
  }, [load, store]);

  return { items, loading, reload: load };
}
