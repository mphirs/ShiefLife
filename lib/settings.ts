import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { todayISO } from './dates';

export type Settings = {
  currency: string; // symbol shown before amounts, e.g. 'MK', '₦', '$'
  avgItemValue: number; // used for "money saved" when a product has no price
  businessMode: boolean;
  onboarded: boolean;
  installDate: string; // streaks never count days before this
  householdCode: string; // '' = not sharing
  remindersEnabled: boolean;
  summaryHour: number; // hour of the morning summary (0-23)
};

export const DEFAULT_SETTINGS: Settings = {
  currency: 'MK',
  avgItemValue: 3000,
  businessMode: false,
  onboarded: false,
  installDate: '',
  householdCode: '',
  remindersEnabled: true,
  summaryHour: 8,
};

const KEY = 'shelflife_settings';
let cache: Settings | null = null;
const listeners = new Set<(s: Settings) => void>();

export async function getSettings(): Promise<Settings> {
  if (cache) return cache;
  let saved: Partial<Settings> = {};
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
  } catch {}
  cache = { ...DEFAULT_SETTINGS, ...saved };
  if (!cache.installDate) {
    cache.installDate = todayISO();
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  }
  return cache;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach(l => l(next));
  return next;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(cache);
  useEffect(() => {
    let alive = true;
    getSettings().then(s => alive && setSettings(s));
    const fn = (s: Settings) => alive && setSettings(s);
    listeners.add(fn);
    return () => {
      alive = false;
      listeners.delete(fn);
    };
  }, []);
  return { settings: settings ?? DEFAULT_SETTINGS, loaded: settings !== null };
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency}${Math.round(amount).toLocaleString()}`;
}
