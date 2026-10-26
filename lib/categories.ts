export type CategoryInfo = { key: string; icon: string; color: string };

export const CATEGORIES: CategoryInfo[] = [
  { key: 'Dairy', icon: '🥛', color: '#3B82F6' },
  { key: 'Produce', icon: '🥬', color: '#16A34A' },
  { key: 'Meat & Fish', icon: '🍗', color: '#DC2626' },
  { key: 'Bakery', icon: '🍞', color: '#D97706' },
  { key: 'Pantry', icon: '🥫', color: '#92400E' },
  { key: 'Drinks', icon: '🧃', color: '#0891B2' },
  { key: 'Medicine', icon: '💊', color: '#7C3AED' },
  { key: 'Household', icon: '🧼', color: '#0D9488' },
  { key: 'Beauty', icon: '🧴', color: '#DB2777' },
  { key: 'Other', icon: '📦', color: '#6B7280' },
];

// Categories used by the first version of the app.
const LEGACY: Record<string, string> = { Food: 'Pantry' };

export function categoryInfo(key: string): CategoryInfo {
  const k = LEGACY[key] ?? key;
  return CATEGORIES.find(c => c.key === k) ?? CATEGORIES[CATEGORIES.length - 1];
}
