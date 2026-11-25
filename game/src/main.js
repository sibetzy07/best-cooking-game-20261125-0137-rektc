// main.js — game loop, state machine, and wiring.
// One clear job: run Sizzle & Serve — title → playing → shift-end summary.
// All the rules of the kitchen (what E does at each station) live here.

import { Input } from './input.js';
import { KitchenAudio } from './audio.js';
import { KITCHEN, buildStations, stationById, drawKitchen } from './kitchen.js';
import { createChef, updateChef, drawChef } from './chef.js';
import { INGREDIENTS, RECIPES, recipeById } from './recipes.js';
import {
  SHIFT_LENGTH, createOrderState, spawnOrder, updateOrders,
  servePlate, drawOrderBoard,
} from './orders.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new KitchenAudio();

function freshState() {
  return {
    screen: 'title', // 'title' | 'playing' | 'summary'
    elapsed: 0,
    chef: createChef(),
    stations: buildStations(),
    board: { item: null, progress: 0 },
    grill: { slots: [{ item: null, t: 0, announced: false }, { item: null, t: 0, announced: false }] },
    assembly: { plate: [], plateIn: 0 },
    orders: createOrderState(),
    nearStation: null,
    moveTarget: null,
    toasts: [], // { text, color, ttl }
    chopSndIn: 0,
    sizzleIn: 0,
    flash: null, // { text, color, ttl } big centre message
    summary: null,
  };
}

let state = freshState();
let lastTime = performance.now();

function toast(text, color = '#3d2b1a') {
  state.toasts.push({ text, color, ttl: 2.6 });
  if (state.toasts.length > 3) state.toasts.shift();
}

function flash(text, color = '#e23b2e', ttl = 1.6) {
  state.flash = { text, color, ttl };
}

function startShift() {
  state = freshState();
  state.screen = 'playing';
  state.elapsed = 0;
  spawnOrder(state.orders, 0);
  spawnOrder(state.orders, 0);
  audio.ensure();
  audio.playRush();
}

// ---------- interaction ----------

function interact() {
  const s = state.nearStation;
  if (!s) { toast('Walk up to a station first!'); return; }
  const chef = state.chef;
  const carry = chef.carry;

  if (s.kind === 'crate') {
    if (carry) { audio.playError(); toast('Hands full — serve or trash something first!'); return; }
    chef.carry = { kind: 'item', id: s.gives };
    audio.playPickup();
    toast(`Picked up ${INGREDIENTS[s.gives].name}`);
    return;
  }

  if (s.kind === 'board') {
    if (!state.board.item && carry && carry.kind === 'item' && INGREDIENTS[carry.id].needs === 'chop') {
      state.board.item = carry.id;
      state.board.progress = 0;
      chef.carry = null;
      audio.playPutDown();
      toast('On the board — hold E to chop!');
      return;
    }
    if (state.board.item && !carry) {
      // Only a finished chopped item comes off the board with a tap;
      // a raw item stays put so holding E can chop it (a tap on a raw
      // item must not snatch it back the moment chopping starts).
      if (state.board.progress < 1) {
        toast('Hold E to chop it first!');
        return;
      }
      chef.carry = { kind: 'item', id: INGREDIENTS[state.board.item].result };
      state.board.item = null;
      state.board.progress = 0;
      audio.playPickup();
      return;
    }
    if (state.board.item && carry) { audio.playError(); toast('The board is busy!'); return; }
    audio.playError();
    toast('Only lettuce & tomato go on the board.');
    return;
  }

  if (s.kind === 'grill') {
    if (carry && carry.kind === 'item' && carry.id === 'patty') {
      const slot = state.grill.slots.find((sl) => !sl.item);
      if (!slot) { audio.playError(); toast('Both grill slots are full!'); return; }
      slot.item = 'patty';
      slot.t = 0;
      slot.announced = false;
      chef.carry = null;
      audio.playSizzle();
      toast('Patty on the grill — watch it!');
      return;
    }
    if (!carry) {
      const slot = state.grill.slots.find((sl) => sl.item);
      if (!slot) { audio.playError(); toast('Grill is empty — bring a patty.'); return; }
      if (slot.item === 'patty_burnt') {
        chef.carry = { kind: 'item', id: 'patty_burnt' };
        audio.playPickup();
        toast('Burnt! Toss it in the trash.');
      } else if (slot.t >= 6) {
        chef.carry = { kind: 'item', id: 'patty_grilled' };
        audio.playPickup();
        toast('Perfectly grilled!');
      } else {
        chef.carry = { kind: 'item', id: 'patty' };
        audio.playPickup();
        toast('Still raw — it needs more time.');
      }
      slot.item = null;
      slot.t = 0;
      slot.announced = false;
      return;
    }
    audio.playError();
    toast('The grill only takes raw patties.');
    return;
  }

  if (s.kind === 'assembly') {
    if (carry && carry.kind === 'plate') {
      state.assembly.plate = carry.items;
      chef.carry = null;
      audio.playPutDown();
      return;
    }
    if (carry && carry.kind === 'item') {
      if (!state.assembly.plate) { audio.playError(); toast('No plate here yet — one is coming!'); return; }
      if (state.assembly.plate.length >= 5) { audio.playError(); toast('That plate is full!'); return; }
      state.assembly.plate.push(carry.id);
      chef.carry = null;
      audio.playPutDown();
      return;
    }
    if (!carry && state.assembly.plate) {
      chef.carry = { kind: 'plate', items: state.assembly.plate };
      state.assembly.plate = null;
      state.assembly.plateIn = 0.9;
      audio.playPickup();
      return;
    }
    audio.playError();
    toast('Plate coming — hold on!');
    return;
  }

  if (s.kind === 'window') {
    if (carry && carry.kind === 'plate') {
      const res = servePlate(state.orders, carry.items);
      if (res.ok) {
        chef.carry = null;
        audio.playServe();
        audio.playCoin();
        flash(`+${res.coins}  ${res.recipe.name} SERVED!${res.tip > 0 ? ` (tip +${res.tip})` : ''}`, '#2c7a1e');
        toast(`${res.recipe.name} served — +${res.coins} coins`);
      } else {
        audio.playError();
        toast(res.reason);
      }
      return;
    }
    if (carry) { audio.playError(); toast('Serve a finished plate, not loose food!'); return; }
    audio.playError();
    toast('Bring a finished plate to the window.');
    return;
  }

  if (s.kind === 'trash') {
    if (!carry) { audio.playError(); toast('Nothing to throw away.'); return; }
    const what = carry.kind === 'plate' ? 'the plate' : INGREDIENTS[carry.id].name;
    chef.carry = null;
    audio.playPutDown();
    toast(`Tossed ${what}.`);
    return;
  }
}

// ---------- per-frame update ----------

function update(dt) {
  if (state.screen === 'title') {
    if (input.hit('Enter', 'Space', 'KeyE')) { audio.ensure(); startShift(); }
    const click = input.takeClick();
    if (click) { audio.ensure(); startShift(); }
    input.endFrame();
    return;
  }

  if (state.screen === 'summary') {
    if (input.hit('KeyR', 'Enter', 'Space')) startShift();
    const click = input.takeClick();
    if (click) startShift();
    input.endFrame();
    return;
  }

  // Playing.
  if (input.hit('KeyR')) { startShift(); input.endFrame(); return; }
  if (input.hit('KeyM')) { audio.muted = !audio.muted; toast(audio.muted ? 'Sound off' : 'Sound on'); }

  state.elapsed += dt;
  audio.ensure();

  // Click-to-move / click-to-use.
  const click = input.takeClick();
  if (click) {
    const st = state.stations.find((s) => click.x >= s.x - 6 && click.x <= s.x + s.w + 6 && click.y >= s.y - 6 && click.y <= s.y + s.h + 6);
    if (st) {
      state.moveTarget = { x: st.x + st.w / 2, y: st.y + st.h + 60, station: st };
    } else {
      state.moveTarget = { x: click.x, y: click.y, station: null };
    }
  }

  // Movement: keys win over a click target.
  const mv = input.moveVector();
  if (mv.x !== 0 || mv.y !== 0) state.moveTarget = null;
  if (state.moveTarget) {
    const dx = state.moveTarget.x - state.chef.x;
    const dy = state.moveTarget.y - state.chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      const target = state.moveTarget;
      state.moveTarget = null;
      if (target.station) {
        state.nearStation = target.station;
        interact();
      }
    } else {
      // Walk straight toward the target.
      state.chef.x += (dx / d) * KITCHEN.chefSpeed * dt;
      state.chef.y += (dy / d) * KITCHEN.chefSpeed * dt;
      state.chef.moving = true;
      state.chef.dirX = dx / d;
      state.chef.dirY = dy / d;
      state.chef.walkPhase += dt * 11;
      const top = KITCHEN.counterY + KITCHEN.counterH + state.chef.radius + 26;
      state.chef.x = Math.max(state.chef.radius + 8, Math.min(KITCHEN.width - state.chef.radius - 8, state.chef.x));
      state.chef.y = Math.max(top, Math.min(KITCHEN.height - state.chef.radius - 10, state.chef.y));
    }
  }

  state.nearStation = updateChef(state.chef, input, dt, state.stations);

  // E to interact (edge), hold E to chop.
  if (input.hit('KeyE')) interact();
  if (state.nearStation && state.nearStation.kind === 'board' && state.board.item
      && INGREDIENTS[state.board.item].needs === 'chop' && state.board.progress < 1
      && input.down('KeyE')) {
    state.board.progress += dt / 1.6;
    state.chopSndIn -= dt;
    if (state.chopSndIn <= 0) { audio.playChop(); state.chopSndIn = 0.28; }
    if (state.board.progress >= 1) {
      state.board.progress = 1;
      state.board.item = INGREDIENTS[state.board.item].result;
      audio.playChopped();
      toast('Chopped! Pick it up.');
    }
  }

  // Grill cooks; patties burn if left too long.
  state.grill.slots.forEach((slot) => {
    if (!slot.item || slot.item === 'patty_burnt') return;
    slot.t += dt;
    if (slot.t >= 6 && !slot.announced) { slot.announced = true; audio.playGrillDone(); toast('Patty is ready — grab it before it burns!'); }
    if (slot.t >= 11) { slot.item = 'patty_burnt'; audio.playError(); toast('A patty burnt on the grill!'); }
  });
  state.sizzleIn -= dt;
  if (state.grill.slots.some((sl) => sl.item && sl.item !== 'patty_burnt') && state.sizzleIn <= 0) {
    audio.playSizzle();
    state.sizzleIn = 1.4;
  }

  // A fresh plate appears at the assembly counter shortly after one is taken.
  if (!state.assembly.plate) {
    state.assembly.plateIn -= dt;
    if (state.assembly.plateIn <= 0) state.assembly.plate = [];
  }

  updateOrders(state.orders, dt, state.elapsed);

  // Announce Rush Hour once, centre-screen, when it begins.
  if (state.orders.rush && !state.rushAnnounced) {
    state.rushAnnounced = true;
    flash('RUSH HOUR!', '#e23b2e', 4);
    audio.playRush();
  }
  if (!state.orders.rush) state.rushAnnounced = false;

  // Toasts + flash decay.
  state.toasts.forEach((to) => { to.ttl -= dt; });
  state.toasts = state.toasts.filter((to) => to.ttl > 0);
  if (state.flash) {
    state.flash.ttl -= dt;
    if (state.flash.ttl <= 0) state.flash = null;
  }

  // Shift over → summary.
  if (state.elapsed >= SHIFT_LENGTH) {
    const o = state.orders;
    const stars = o.served >= 14 ? 3 : o.served >= 9 ? 2 : o.served >= 5 ? 1 : 0;
    state.summary = { coins: o.earned, served: o.served, missed: o.missed, bestTip: o.bestTip, stars };
    state.screen = 'summary';
    audio.playGameOver();
  }

  input.endFrame();
}

// ---------- drawing ----------

function drawHintBar() {
  const chef = state.chef;
  let hint = 'WASD / arrows move  •  E interact  •  hold E to chop  •  R restart';
  if (state.nearStation) {
    const s = state.nearStation;
    if (s.kind === 'crate') hint = `Press E to take ${INGREDIENTS[s.gives].name} — hands ${chef.carry ? 'full' : 'empty'}`;
    else if (s.kind === 'board') hint = state.board.item ? 'Hold E to chop — pick it up with E when done' : 'Press E to put lettuce or tomato on the board';
    else if (s.kind === 'grill') hint = 'Press E: put a raw patty on, or take a grilled one off';
    else if (s.kind === 'assembly') hint = 'Press E: add food to the plate, or pick the plate up';
    else if (s.kind === 'window') hint = 'Press E to serve the plate you are carrying';
    else if (s.kind === 'trash') hint = 'Press E to toss what you are carrying';
  } else if (chef.carry) {
    hint = chef.carry.kind === 'plate'
      ? 'Carrying a plate — take it to the Serving Window!'
      : `Carrying ${INGREDIENTS[chef.carry.id].name} — chop it, grill it, or add it to a plate`;
  }
  ctx.fillStyle = 'rgba(61,43,26,0.92)';
  ctx.fillRect(0, 692, 1280, 28);
  ctx.fillStyle = '#ffe9bd';
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hint, 640, 706);
}

function drawToasts() {
  state.toasts.forEach((to, i) => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, to.ttl);
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 1.5;
    const y = 640 - i * 34;
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(to.text).width + 28;
    ctx.beginPath();
    ctx.roundRect(640 - w / 2, y - 15, w, 30, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = to.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(to.text, 640, y);
    ctx.restore();
  });
}

function drawFlash() {
  if (!state.flash) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.flash.ttl * 2);
  ctx.fillStyle = state.flash.color;
  ctx.font = 'bold 34px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.fillText(state.flash.text, 640, 330);
  ctx.restore();
}

function drawTitle(t) {
  ctx.fillStyle = 'rgba(43,29,18,0.55)';
  ctx.fillRect(0, 100, 1280, 620);
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.roundRect(290, 150, 700, 420, 18);
  ctx.fill();
  ctx.strokeStyle = '#c96f3f';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#c96f3f';
  ctx.font = 'bold 52px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SIZZLE & SERVE', 640, 215);
  ctx.fillStyle = '#3d2b1a';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('One chef. One rush. Feed the lunch crowd!', 640, 258);
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#5d4126';
  const lines = [
    'Grab ingredients from the crates, chop lettuce & tomato on the board,',
    'grill patties (don\'t let them burn!), build dishes on a plate,',
    'and serve them at the window before patience runs out.',
    '',
    'MENU — Burger 12  •  Cheese Burger 16  •  Garden Salad 10  •  Veggie Stack 14',
    'Fast service earns tips up to +8. Rush Hour hits mid-shift!',
    '',
    'WASD / arrows — move      E — interact (hold E to chop)',
    'Click a station — walk there & use it      R — restart      M — mute',
  ];
  lines.forEach((ln, i) => ctx.fillText(ln, 640, 292 + i * 24));
  ctx.fillStyle = '#2c7a1e';
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  const pulse = 0.75 + Math.sin(t * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillText('▶  Press ENTER or click to start your shift  ◀', 640, 530);
  ctx.globalAlpha = 1;
}

function drawSummary() {
  ctx.fillStyle = 'rgba(43,29,18,0.6)';
  ctx.fillRect(0, 100, 1280, 620);
  const s = state.summary;
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.roundRect(340, 150, 600, 400, 18);
  ctx.fill();
  ctx.strokeStyle = '#c96f3f';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#c96f3f';
  ctx.font = 'bold 40px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SHIFT OVER!', 640, 205);
  ctx.fillStyle = '#f5c542';
  ctx.font = '44px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('★'.repeat(s.stars) + '☆'.repeat(3 - s.stars), 640, 255);
  ctx.fillStyle = '#3d2b1a';
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Coins earned: ${s.coins}`, 640, 305);
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Dishes served: ${s.served}    •    Orders missed: ${s.missed}`, 640, 340);
  ctx.fillText(`Best tip: +${s.bestTip}`, 640, 372);
  ctx.fillStyle = '#5d4126';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  const verdict = s.stars === 3 ? 'Head-chef material! The crowd loved you.'
    : s.stars === 2 ? 'A solid shift — the grill barely kept up.'
    : s.stars === 1 ? 'You fed a few — tomorrow, faster feet!'
    : 'Rough shift… the tickets piled up. Try again!';
  ctx.fillText(verdict, 640, 410);
  ctx.fillStyle = '#2c7a1e';
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Press R to cook another shift', 640, 490);
}

function render(t) {
  ctx.clearRect(0, 0, 1280, 720);
  drawKitchen(ctx, state, t);
  if (state.screen !== 'title') drawChef(ctx, state.chef, t);
  else {
    // A chef idling on the title screen, for warmth.
    drawChef(ctx, state.chef, t);
  }
  drawOrderBoard(ctx, state.orders, state.screen === 'playing' ? state.elapsed : (state.screen === 'summary' ? SHIFT_LENGTH : 0), t);
  if (state.screen === 'playing') {
    drawHintBar();
    drawToasts();
    drawFlash();
  }
  if (state.screen === 'title') drawTitle(t);
  if (state.screen === 'summary') drawSummary();
}

// ---------- staged scenes for screenshots ----------
// ?scene=cover|title|rush|served — the game itself, staged via its own state.

function applyScene(name) {
  if (name === 'title') { state.screen = 'title'; return; }
  if (name === 'served') {
    state.screen = 'summary';
    state.summary = { coins: 132, served: 9, missed: 1, bestTip: 8, stars: 2 };
    state.orders.coins = 132;
    state.orders.served = 9;
    state.orders.missed = 1;
    return;
  }
  startShift();
  if (name === 'cover') {
    state.elapsed = 26; // 2:34 left on the clock
    state.orders.coins = 48;
    state.orders.served = 3;
    state.orders.orders = [
      { uid: 1, recipeId: 'burger', left: 28, max: 44, born: 0 },
      { uid: 2, recipeId: 'cheeseburger', left: 19, max: 40, born: 0 },
      { uid: 3, recipeId: 'salad', left: 35, max: 46, born: 0 },
    ];
    state.assembly.plate = ['bun', 'patty_grilled']; // dish mid-assembly
    state.board.item = 'tomato';
    state.board.progress = 0.55; // chopping in progress
    state.grill.slots[0] = { item: 'patty', t: 4.2, announced: false };
    state.chef.x = 990;
    state.chef.y = 300;
    state.chef.carry = { kind: 'item', id: 'lettuce_chopped' };
    state.chef.dirX = 0; state.chef.dirY = -1;
    state.nearStation = stationById(state.stations, 'assembly');
    state.toasts = [{ text: 'Chopping… hold E!', color: '#3d2b1a', ttl: 2.6 }];
  }
  if (name === 'rush') {
    state.elapsed = 72; // mid-shift, Rush Hour
    state.orders.coins = 86;
    state.orders.served = 6;
    state.orders.rush = true;
    state.orders.orders = [
      { uid: 1, recipeId: 'burger', left: 22, max: 38, born: 0 },
      { uid: 2, recipeId: 'cheeseburger', left: 14, max: 36, born: 0 },
      { uid: 3, recipeId: 'salad', left: 31, max: 40, born: 0 },
      { uid: 4, recipeId: 'veggie', left: 26, max: 42, born: 0 },
    ];
    state.grill.slots[0] = { item: 'patty', t: 6.5, announced: true };
    state.grill.slots[1] = { item: 'patty', t: 2.0, announced: false };
    state.board.item = 'lettuce';
    state.board.progress = 0.8;
    state.assembly.plate = ['bun', 'patty_grilled', 'lettuce_chopped'];
    state.chef.x = 830;
    state.chef.y = 300;
    state.chef.carry = { kind: 'item', id: 'cheese' };
    state.flash = { text: 'RUSH HOUR!', color: '#e23b2e', ttl: 60 };
  }
}

// ---------- boot ----------

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}

const scene = new URLSearchParams(location.search).get('scene');
if (scene) applyScene(scene);
requestAnimationFrame(frame);

// Hooks for automated play-testing (read-only state + a few helpers).
window.__sizzle = {
  get state() { return state; },
  startShift,
  interact,
  teleport(x, y) { state.chef.x = x; state.chef.y = y; state.moveTarget = null; },
  snapshot() {
    return {
      screen: state.screen,
      elapsed: +state.elapsed.toFixed(2),
      coins: state.orders.coins,
      served: state.orders.served,
      missed: state.orders.missed,
      orders: state.orders.orders.map((o) => ({ recipe: o.recipeId, left: +o.left.toFixed(1) })),
      carry: state.chef.carry,
      board: { ...state.board },
      grill: state.grill.slots.map((s) => ({ item: s.item, t: +s.t.toFixed(1) })),
      plate: state.assembly.plate,
      chef: { x: Math.round(state.chef.x), y: Math.round(state.chef.y) },
    };
  },
};
