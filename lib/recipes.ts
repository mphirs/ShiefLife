// "Use your tomatoes and eggs tonight." Offline recipe matcher.
// `needs` entries can list synonyms separated by '|'. Add your own local recipes freely.
import { ShelfProduct, daysUntilExpiry } from './products';

export type Recipe = {
  id: string;
  title: string;
  emoji: string;
  minutes: number;
  needs: string[];
  pantry: string; // things most kitchens already have
  steps: string[];
};

export const RECIPES: Recipe[] = [
  { id: 'tomato-egg', title: 'Tomato & egg stew', emoji: '🍳', minutes: 15, needs: ['tomato', 'egg'], pantry: 'onion, oil, salt',
    steps: ['Fry chopped onion in oil until soft.', 'Add chopped tomatoes and cook 8 minutes until saucy.', 'Crack in the eggs and stir gently until set.', 'Season and serve with nsima, rice or bread.'] },
  { id: 'omelette', title: 'Veggie omelette', emoji: '🥚', minutes: 10, needs: ['egg', 'onion|tomato|pepper|spinach'], pantry: 'oil, salt',
    steps: ['Whisk eggs with a pinch of salt.', 'Fry chopped vegetables for 2 minutes.', 'Pour in eggs and cook on medium heat.', 'Fold and serve.'] },
  { id: 'french-toast', title: 'French toast', emoji: '🍞', minutes: 12, needs: ['bread', 'egg', 'milk'], pantry: 'sugar, oil',
    steps: ['Whisk eggs, milk and a spoon of sugar.', 'Dip bread slices on both sides.', 'Fry in a little oil until golden.', 'Serve warm.'] },
  { id: 'banana-pancakes', title: 'Banana pancakes', emoji: '🥞', minutes: 20, needs: ['banana', 'egg', 'flour'], pantry: 'milk or water, oil',
    steps: ['Mash the bananas.', 'Mix with eggs, flour and a splash of milk or water.', 'Fry small rounds in a lightly oiled pan.', 'Flip when bubbles appear.'] },
  { id: 'stir-fry', title: 'Quick vegetable stir-fry', emoji: '🥘', minutes: 15, needs: ['cabbage|rape|kale|spinach', 'carrot', 'pepper|onion'], pantry: 'oil, salt, soy sauce (optional)',
    steps: ['Slice all vegetables thinly.', 'Heat oil in a wide pan.', 'Stir-fry hardest vegetables first, then greens.', 'Season and serve hot.'] },
  { id: 'tomato-soup', title: 'Tomato soup', emoji: '🍅', minutes: 25, needs: ['tomato', 'onion'], pantry: 'oil, garlic, salt, water',
    steps: ['Fry onion and garlic in oil.', 'Add chopped tomatoes and a cup of water.', 'Simmer 15 minutes then mash or blend.', 'Season and serve with bread.'] },
  { id: 'ndiwo-greens', title: 'Greens in groundnut sauce (ndiwo)', emoji: '🥬', minutes: 20, needs: ['rape|kale|spinach|greens|pumpkin leaves', 'groundnut|peanut', 'tomato|onion'], pantry: 'oil, salt',
    steps: ['Boil the greens briefly and drain.', 'Fry onion and tomato.', 'Add greens and a few spoons of ground groundnuts with a little water.', 'Simmer 5 minutes and serve with nsima.'] },
  { id: 'chicken-rice', title: 'One-pot chicken & rice', emoji: '🍗', minutes: 40, needs: ['chicken', 'rice', 'onion|tomato|pepper'], pantry: 'oil, salt, water or stock',
    steps: ['Brown the chicken pieces in oil.', 'Add chopped vegetables and stir.', 'Add rice and twice its volume of water.', 'Cover and cook on low until the rice is tender.'] },
  { id: 'fish-stew', title: 'Tomato fish stew', emoji: '🐟', minutes: 30, needs: ['fish|chambo|tilapia', 'tomato', 'onion'], pantry: 'oil, salt, spices',
    steps: ['Fry onion until golden.', 'Add tomatoes and cook into a sauce.', 'Lay in the fish and simmer 10 minutes.', 'Serve with nsima or rice.'] },
  { id: 'fruit-smoothie', title: 'Fruit & yogurt smoothie', emoji: '🥤', minutes: 5, needs: ['banana|mango|apple|pineapple|orange', 'yogurt|yoghurt|milk'], pantry: 'honey or sugar (optional)',
    steps: ['Peel and chop the fruit.', 'Blend or mash with yogurt or milk.', 'Sweeten if needed and serve cold.'] },
  { id: 'bread-pudding', title: 'Bread pudding', emoji: '🍮', minutes: 40, needs: ['bread', 'milk', 'egg'], pantry: 'sugar',
    steps: ['Tear stale bread into a dish.', 'Whisk milk, eggs and sugar and pour over.', 'Let soak 10 minutes.', 'Bake or steam until set.'] },
  { id: 'potato-mince', title: 'Mince & potato bake', emoji: '🥔', minutes: 45, needs: ['potato', 'mince|beef|meat', 'onion|tomato'], pantry: 'oil, salt',
    steps: ['Boil sliced potatoes until nearly tender.', 'Fry mince with onion and tomato.', 'Layer mince and potatoes in a pot or dish.', 'Cook or bake until golden.'] },
];

export type RecipeMatch = {
  recipe: Recipe;
  uses: string[]; // product names you already have
  expiringUses: string[]; // subset that expires within 7 days
  missing: string[];
  score: number;
};

function labelOf(need: string) {
  return need.split('|')[0];
}

export function suggestRecipes(products: ShelfProduct[]): RecipeMatch[] {
  const withDays = products.map(p => ({ p, days: daysUntilExpiry(p.expiryDate), n: p.name.toLowerCase() }));
  const matches: RecipeMatch[] = [];

  for (const recipe of RECIPES) {
    const uses: string[] = [];
    const expiringUses: string[] = [];
    const missing: string[] = [];
    for (const need of recipe.needs) {
      const keys = need.split('|');
      const hit = withDays.find(x => keys.some(k => x.n.includes(k)));
      if (hit) {
        uses.push(hit.p.name);
        if (hit.days <= 7) expiringUses.push(hit.p.name);
      } else missing.push(labelOf(need));
    }
    if (uses.length === 0) continue;
    matches.push({ recipe, uses, expiringUses, missing, score: expiringUses.length * 3 + uses.length - missing.length * 0.5 });
  }

  const anyExpiring = matches.some(m => m.expiringUses.length > 0);
  return matches
    .filter(m => (anyExpiring ? m.expiringUses.length > 0 : m.uses.length >= 2))
    .sort((a, b) => b.score - a.score);
}
