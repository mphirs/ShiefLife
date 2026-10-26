// "Smart default dates": type "milk" -> ~7 days, "tomatoes" -> ~5 days.
// Edit / extend this list freely. Aliases are matched at the START of a word (so "tomato"
// matches "tomatoes" but "rice" does not match "price"). The longest alias match wins,
// so "tomato paste" beats "tomato".
export type ShelfEntry = { name: string; days: number; category: string; aliases?: string[] };

export const SHELF_LIFE: ShelfEntry[] = [
  // Dairy & eggs
  { name: 'Milk', days: 7, category: 'Dairy', aliases: ['mkaka', 'fresh milk'] },
  { name: 'Yogurt', days: 14, category: 'Dairy', aliases: ['yoghurt'] },
  { name: 'Cheese', days: 30, category: 'Dairy' },
  { name: 'Butter', days: 60, category: 'Dairy' },
  { name: 'Cream', days: 7, category: 'Dairy' },
  { name: 'Eggs', days: 21, category: 'Dairy', aliases: ['egg', 'mazira'] },
  // Produce
  { name: 'Tomatoes', days: 5, category: 'Produce', aliases: ['tomato', 'matimati'] },
  { name: 'Onions', days: 30, category: 'Produce', aliases: ['onion'] },
  { name: 'Potatoes', days: 21, category: 'Produce', aliases: ['potato'] },
  { name: 'Sweet potatoes', days: 21, category: 'Produce', aliases: ['sweet potato'] },
  { name: 'Cassava', days: 5, category: 'Produce' },
  { name: 'Bananas', days: 5, category: 'Produce', aliases: ['banana'] },
  { name: 'Mangoes', days: 5, category: 'Produce', aliases: ['mango'] },
  { name: 'Apples', days: 14, category: 'Produce', aliases: ['apple'] },
  { name: 'Oranges', days: 14, category: 'Produce', aliases: ['orange'] },
  { name: 'Lemons', days: 21, category: 'Produce', aliases: ['lemon'] },
  { name: 'Avocado', days: 4, category: 'Produce', aliases: ['avocados'] },
  { name: 'Pineapple', days: 5, category: 'Produce' },
  { name: 'Watermelon', days: 7, category: 'Produce' },
  { name: 'Grapes', days: 7, category: 'Produce', aliases: ['grape'] },
  { name: 'Cabbage', days: 10, category: 'Produce' },
  { name: 'Carrots', days: 14, category: 'Produce', aliases: ['carrot'] },
  { name: 'Spinach', days: 4, category: 'Produce' },
  { name: 'Greens (rape/kale)', days: 3, category: 'Produce', aliases: ['rape', 'kale', 'greens', 'chinese cabbage', 'pumpkin leaves', 'bonongwe'] },
  { name: 'Peppers', days: 7, category: 'Produce', aliases: ['pepper', 'capsicum'] },
  { name: 'Cucumber', days: 7, category: 'Produce' },
  { name: 'Lettuce', days: 5, category: 'Produce' },
  { name: 'Okra', days: 4, category: 'Produce' },
  { name: 'Garlic', days: 60, category: 'Produce' },
  { name: 'Ginger', days: 21, category: 'Produce' },
  { name: 'Pumpkin', days: 30, category: 'Produce' },
  // Meat & fish
  { name: 'Chicken', days: 2, category: 'Meat & Fish', aliases: ['nkhuku'] },
  { name: 'Beef', days: 3, category: 'Meat & Fish', aliases: ['nyama'] },
  { name: 'Minced meat', days: 2, category: 'Meat & Fish', aliases: ['mince'] },
  { name: 'Pork', days: 3, category: 'Meat & Fish' },
  { name: 'Goat meat', days: 3, category: 'Meat & Fish', aliases: ['goat'] },
  { name: 'Fresh fish', days: 2, category: 'Meat & Fish', aliases: ['fish', 'chambo', 'tilapia', 'nsomba'] },
  { name: 'Dried fish', days: 60, category: 'Meat & Fish', aliases: ['kapenta', 'usipa', 'dried fish'] },
  { name: 'Sausages', days: 5, category: 'Meat & Fish', aliases: ['sausage'] },
  { name: 'Bacon', days: 7, category: 'Meat & Fish' },
  // Bakery
  { name: 'Bread', days: 4, category: 'Bakery' },
  { name: 'Buns', days: 3, category: 'Bakery', aliases: ['bun'] },
  { name: 'Cake', days: 4, category: 'Bakery' },
  { name: 'Mandazi', days: 2, category: 'Bakery' },
  // Drinks
  { name: 'Fresh juice', days: 7, category: 'Drinks', aliases: ['juice'] },
  { name: 'Soda', days: 180, category: 'Drinks', aliases: ['soft drink', 'coke', 'fanta', 'sprite'] },
  { name: 'Water', days: 365, category: 'Drinks' },
  // Pantry
  { name: 'Rice', days: 365, category: 'Pantry' },
  { name: 'Maize flour', days: 180, category: 'Pantry', aliases: ['ufa', 'flour'] },
  { name: 'Sugar', days: 365, category: 'Pantry' },
  { name: 'Cooking oil', days: 365, category: 'Pantry', aliases: ['oil'] },
  { name: 'Pasta', days: 365, category: 'Pantry', aliases: ['spaghetti', 'macaroni'] },
  { name: 'Beans', days: 365, category: 'Pantry', aliases: ['nyemba'] },
  { name: 'Groundnuts', days: 180, category: 'Pantry', aliases: ['peanut', 'nthochi'] },
  { name: 'Peanut butter', days: 180, category: 'Pantry' },
  { name: 'Tomato paste', days: 365, category: 'Pantry' },
  { name: 'Canned food', days: 365, category: 'Pantry', aliases: ['tin', 'canned'] },
  { name: 'Biscuits', days: 120, category: 'Pantry', aliases: ['biscuit', 'cookies'] },
  { name: 'Cereal', days: 180, category: 'Pantry' },
  { name: 'Instant noodles', days: 270, category: 'Pantry', aliases: ['noodles'] },
  { name: 'Jam', days: 180, category: 'Pantry' },
  { name: 'Tea', days: 365, category: 'Pantry' },
  { name: 'Coffee', days: 365, category: 'Pantry' },
  // Medicine
  { name: 'Paracetamol', days: 730, category: 'Medicine', aliases: ['panadol'] },
  { name: 'Ibuprofen', days: 730, category: 'Medicine' },
  { name: 'Tablets', days: 730, category: 'Medicine', aliases: ['tablet', 'capsule', 'antibiotic'] },
  { name: 'Cough syrup', days: 90, category: 'Medicine', aliases: ['syrup'] },
  { name: 'Ointment', days: 365, category: 'Medicine', aliases: ['cream ointment'] },
  { name: 'Vitamins', days: 365, category: 'Medicine', aliases: ['vitamin'] },
  // Household & beauty
  { name: 'Detergent', days: 730, category: 'Household' },
  { name: 'Soap', days: 730, category: 'Household' },
  { name: 'Bleach', days: 180, category: 'Household' },
  { name: 'Toothpaste', days: 730, category: 'Beauty' },
  { name: 'Body lotion', days: 365, category: 'Beauty', aliases: ['lotion', 'vaseline'] },
  { name: 'Sunscreen', days: 365, category: 'Beauty' },
  { name: 'Shampoo', days: 730, category: 'Beauty' },
  { name: 'Deodorant', days: 730, category: 'Beauty' },
];

export const CATEGORY_DEFAULT_DAYS: Record<string, number> = {
  Dairy: 7, Produce: 5, 'Meat & Fish': 3, Bakery: 4, Pantry: 180,
  Drinks: 30, Medicine: 365, Household: 365, Beauty: 365, Other: 30,
};

/** How many days freezing adds to an item's date. */
export function frozenExtension(category: string): number {
  switch (category) {
    case 'Meat & Fish': return 90;
    case 'Produce': return 120;
    case 'Dairy': return 60;
    case 'Bakery': return 60;
    default: return 30;
  }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function allAliases(e: ShelfEntry): string[] {
  return [e.name.toLowerCase(), ...(e.aliases ?? []).map(a => a.toLowerCase())];
}

/** Returns a suggested shelf life for a free-text product name, or null if unknown. */
export function suggestShelfLife(text: string): ShelfEntry | null {
  const q = text.toLowerCase().trim();
  if (q.length < 2) return null;
  let best: { entry: ShelfEntry; len: number } | null = null;
  for (const entry of SHELF_LIFE) {
    for (const alias of allAliases(entry)) {
      if (new RegExp(`\\b${esc(alias)}`).test(q) && (!best || alias.length > best.len)) {
        best = { entry, len: alias.length };
      }
    }
  }
  return best ? best.entry : null;
}

/** Autocomplete suggestions while typing. */
export function searchShelfLife(text: string, limit = 5): ShelfEntry[] {
  const q = text.toLowerCase().trim();
  if (q.length < 2) return [];
  const starts: ShelfEntry[] = [];
  const contains: ShelfEntry[] = [];
  for (const e of SHELF_LIFE) {
    const names = allAliases(e);
    if (names.some(n => n.startsWith(q))) starts.push(e);
    else if (names.some(n => n.includes(q))) contains.push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}
