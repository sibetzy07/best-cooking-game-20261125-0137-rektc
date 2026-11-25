// orders.js — the order board: tickets, patience, tips and scoring.
// One clear job: what customers want, how long they wait, and what a
// well-served dish is worth.

import { RECIPES, matchRecipe } from './recipes.js';
import { drawFood } from './draw.js';

// Short names for the ticket's ingredient line (must fit one line).
const TICKET_ITEM = {
  bun: 'Bun', cheese: 'Cheese', patty_grilled: 'Patty',
  lettuce_chopped: 'Lettuce', tomato_chopped: 'Tomato',
};

export const SHIFT_LENGTH = 180; // seconds per shift
export const MAX_ORDERS = 4;

export function createOrderState() {
  return {
    orders: [], // { uid, recipeId, left, max, born }
    nextUid: 1,
    spawnIn: 2.5, // seconds until the next ticket arrives
    served: 0,
    missed: 0,
    coins: 0,
    earned: 0,
    bestTip: 0,
    rush: false,
    rushShown: false,
  };
}

function pickRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

// Patience shrinks as the shift goes on: 48s early, ~30s late.
export function patienceFor(elapsed) {
  return Math.max(30, 48 - elapsed * 0.1);
}

// Spawn gap shrinks too: ~13s early, ~7s late (faster in rush).
export function spawnGapFor(elapsed, rush) {
  const base = Math.max(7, 13 - elapsed * 0.035);
  return rush ? base * 0.55 : base;
}

export function spawnOrder(state, elapsed, rng = Math.random) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(rng);
  const patience = patienceFor(elapsed);
  const order = {
    uid: state.nextUid++,
    recipeId: recipe.id,
    left: patience,
    max: patience,
    born: elapsed,
  };
  state.orders.push(order);
  return order;
}

export function updateOrders(state, dt, elapsed) {
  // Rush Hour: a burst of tickets in the middle of the shift.
  const inRush = elapsed >= 60 && elapsed < 95;
  if (inRush && !state.rush) {
    state.rush = true;
    state.rushShown = true;
    while (state.orders.length < MAX_ORDERS) spawnOrder(state, elapsed);
  }
  if (!inRush && state.rush) state.rush = false;

  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state, elapsed);
    state.spawnIn = spawnGapFor(elapsed, state.rush);
  }

  // Patience ticks down; an expired ticket is missed.
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    o.left -= dt;
    if (o.left <= 0) {
      state.orders.splice(i, 1);
      state.missed += 1;
    }
  }
}

// Try to serve a plate. Returns { ok, recipe, coins, tip, reason }.
export function servePlate(state, plateItems) {
  const recipe = matchRecipe(plateItems);
  if (!recipe) return { ok: false, reason: 'No order wants this exact dish.' };
  const idx = state.orders.findIndex((o) => o.recipeId === recipe.id);
  if (idx === -1) return { ok: false, reason: `Nobody ordered a ${recipe.name} right now.` };
  const order = state.orders[idx];
  const patienceFrac = Math.max(0, order.left / order.max);
  const tip = Math.round(patienceFrac * 8);
  const coins = recipe.price + tip;
  state.orders.splice(idx, 1);
  state.served += 1;
  state.coins += coins;
  state.earned += coins;
  state.bestTip = Math.max(state.bestTip, tip);
  return { ok: true, recipe, coins, tip, patienceFrac };
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function drawOrderBoard(ctx, state, elapsed, t) {
  const W = 1280;
  // Board background.
  ctx.fillStyle = '#3d2b1a';
  ctx.fillRect(0, 0, W, 100);
  ctx.fillStyle = '#5d4126';
  ctx.fillRect(0, 96, W, 4);
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDER BOARD', 14, 16);

  // Tickets.
  state.orders.forEach((o, i) => {
    const recipe = RECIPES.find((r) => r.id === o.recipeId);
    const x = 12 + i * 218;
    const y = 26;
    const w = 206;
    const h = 74;
    const frac = Math.max(0, o.left / o.max);
    const urgent = frac < 0.35;
    ctx.fillStyle = urgent && Math.sin(t * 8) > 0 ? '#fff0d0' : '#fff8e7';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e23b2e' : '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3d2b1a';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, x + 10, y + 16);
    ctx.fillStyle = urgent ? '#c22a1a' : '#7a4a00';
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fmtTime(Math.max(0, o.left)), x + w - 10, y + 16);
    // Ingredient dots.
    recipe.items.forEach((id, j) => {
      drawFood(ctx, id, x + 22 + j * 34, y + 40, 11, t + j);
    });
    ctx.fillStyle = '#7a6a55';
    ctx.font = '10px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.items.map((id) => TICKET_ITEM[id] || id).join(' · '), x + 10, y + 57);
    // Patience bar.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 10, y + 66, w - 20, 5);
    ctx.fillStyle = frac > 0.5 ? '#5da83c' : frac > 0.25 ? '#ffb020' : '#e23b2e';
    ctx.fillRect(x + 10, y + 66, (w - 20) * frac, 5);
  });

  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'italic 14px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('No orders yet — the lunch crowd is coming…', 14, 60);
  }

  // Right panel: shift timer, coins, served / missed.
  const px = 920;
  const remain = Math.max(0, SHIFT_LENGTH - elapsed);
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SHIFT', px, 16);
  ctx.fillStyle = remain < 30 ? '#ff7a5c' : '#ffffff';
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(fmtTime(remain), px, 44);
  // Shift progress bar.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(px, 64, 150, 8);
  ctx.fillStyle = '#ffb020';
  ctx.fillRect(px, 64, 150 * (remain / SHIFT_LENGTH), 8);

  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('COINS', px + 170, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(String(state.coins), px + 196, 44);
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(px + 180, 42, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5a00';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C', px + 180, 43);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cfe8b8';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Served ${state.served}  •  Missed ${state.missed}`, px + 170, 66);

  // (The RUSH HOUR! banner is flashed centre-screen by main.js instead,
  // so it never collides with the station labels just under the board.)
}
