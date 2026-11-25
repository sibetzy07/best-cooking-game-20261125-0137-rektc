// recipes.js — every ingredient and dish in Sizzle & Serve.
// One clear job: the data that defines what can be cooked and served.
// Item ids: raw forms come from crates; chopped / grilled forms are the
// cooked results. A recipe lists the exact finished items a plate needs.

export const INGREDIENTS = {
  tomato:         { name: 'Tomato',  short: 'Tomato',  color: '#e23b2e', dark: '#a81f16', needs: 'chop',  result: 'tomato_chopped' },
  lettuce:        { name: 'Lettuce', short: 'Lettuce', color: '#5da83c', dark: '#3c7a22', needs: 'chop',  result: 'lettuce_chopped' },
  patty:          { name: 'Patty',   short: 'Patty',   color: '#c46a4a', dark: '#8a3f28', needs: 'grill', result: 'patty_grilled' },
  bun:            { name: 'Bun',     short: 'Bun',     color: '#e8a94f', dark: '#b57a2a', needs: null,    result: 'bun' },
  cheese:         { name: 'Cheese',  short: 'Cheese',  color: '#f5c542', dark: '#d19a1d', needs: null,    result: 'cheese' },
  tomato_chopped: { name: 'Chopped Tomato',  short: 'Chop. Tomato',  color: '#ef6a4d', dark: '#c23a22', needs: null, result: 'tomato_chopped' },
  lettuce_chopped:{ name: 'Chopped Lettuce', short: 'Chop. Lettuce', color: '#7cc24f', dark: '#4c8a2c', needs: null, result: 'lettuce_chopped' },
  patty_grilled:  { name: 'Grilled Patty',   short: 'Grilled Patty', color: '#7a4a26', dark: '#4d2c14', needs: null, result: 'patty_grilled' },
  patty_burnt:    { name: 'Burnt Patty',     short: 'Burnt!',        color: '#241a12', dark: '#000000', needs: null, result: 'patty_burnt' },
};

export const CRATE_ORDER = ['tomato', 'lettuce', 'patty', 'bun', 'cheese'];

export const RECIPES = [
  {
    id: 'burger', name: 'Burger', price: 12,
    items: ['bun', 'patty_grilled', 'lettuce_chopped'],
    blurb: 'Bun + grilled patty + chopped lettuce',
  },
  {
    id: 'cheeseburger', name: 'Cheese Burger', price: 16,
    items: ['bun', 'patty_grilled', 'cheese', 'tomato_chopped'],
    blurb: 'Bun + grilled patty + cheese + chopped tomato',
  },
  {
    id: 'salad', name: 'Garden Salad', price: 10,
    items: ['lettuce_chopped', 'tomato_chopped'],
    blurb: 'Chopped lettuce + chopped tomato',
  },
  {
    id: 'veggie', name: 'Veggie Stack', price: 14,
    items: ['bun', 'lettuce_chopped', 'tomato_chopped', 'cheese'],
    blurb: 'Bun + lettuce + tomato + cheese',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function recipeName(id) {
  const r = recipeById(id);
  return r ? r.name : id;
}

// True when a plate's items are exactly one recipe's items, any order.
export function matchRecipe(plateItems) {
  const sorted = [...plateItems].sort().join('|');
  return RECIPES.find((r) => [...r.items].sort().join('|') === sorted) || null;
}

// Short label for an item id, for tickets and tooltips.
export function itemLabel(id) {
  const ing = INGREDIENTS[id];
  return ing ? ing.short : id;
}
