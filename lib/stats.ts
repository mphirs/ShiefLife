import { daysBetween, todayISO, toISODate } from './dates';
import { WasteEvent } from './events';
import { Settings, formatMoney } from './settings';

export type MonthStats = {
  saved: number;
  used: number;
  thrown: number;
  wasted: number;
  score: number | null; // % of items used instead of thrown
  streak: number; // days since the last thrown-out item
};

export function monthlyStats(events: WasteEvent[], settings: Settings, now = new Date()): MonthStats {
  const inMonth = events.filter(e => {
    const d = new Date(e.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const usedEv = inMonth.filter(e => e.action === 'used');
  const thrownEv = inMonth.filter(e => e.action === 'thrown');
  const saved = usedEv.filter(e => e.beforeExpiry).reduce((s, e) => s + e.value, 0);
  const wasted = thrownEv.reduce((s, e) => s + e.value, 0);
  const total = usedEv.length + thrownEv.length;

  const lastThrown = events
    .filter(e => e.action === 'thrown')
    .map(e => toISODate(new Date(e.at)))
    .sort()
    .pop();
  const start = lastThrown && lastThrown > settings.installDate ? lastThrown : settings.installDate;
  const streak = Math.max(0, daysBetween(start || todayISO(), todayISO()));

  return {
    saved,
    used: usedEv.length,
    thrown: thrownEv.length,
    wasted,
    score: total ? Math.round((usedEv.length / total) * 100) : null,
    streak,
  };
}

export function shareText(s: MonthStats, settings: Settings): string {
  const month = new Date().toLocaleString('en', { month: 'long' });
  return (
    `🌿 My ${month} with ShelfLife\n` +
    `💰 Saved ${formatMoney(s.saved, settings.currency)} of food\n` +
    `🔥 ${s.streak}-day zero-waste streak\n` +
    (s.score !== null ? `✅ Waste score: ${s.score}%\n` : '') +
    `Waste less. Save more.`
  );
}
