// kitchen.js — the room: floor, walls, counters and every station.
// One clear job: where things are, and how the kitchen looks.
// Stations live on the top counter row; the trash sits bottom-left.

import { CRATE_ORDER, INGREDIENTS } from './recipes.js';
import { drawFood, drawPlate, drawSteam } from './draw.js';

export const KITCHEN = {
  width: 1280,
  height: 720,
  hudHeight: 100,
  floorTop: 100,
  counterY: 124,
  counterH: 66,
  chefRadius: 22,
  chefSpeed: 270,
};

// Build the station list once. Each station: { id, kind, x, y, w, h, label, sub }.
export function buildStations() {
  const y = KITCHEN.counterY;
  const h = KITCHEN.counterH;
  const stations = [];
  const crateW = 104;
  CRATE_ORDER.forEach((id, i) => {
    stations.push({
      id: `crate_${id}`, kind: 'crate', gives: id,
      x: 24 + i * 116, y, w: crateW, h,
      label: INGREDIENTS[id].name, sub: 'crate — take',
    });
  });
  stations.push({ id: 'board', kind: 'board', x: 616, y, w: 118, h, label: 'Chopping Board', sub: 'hold E to chop' });
  stations.push({ id: 'grill', kind: 'grill', x: 746, y, w: 168, h, label: 'Grill', sub: 'patties cook here' });
  stations.push({ id: 'assembly', kind: 'assembly', x: 926, y, w: 128, h, label: 'Assembly', sub: 'build the dish' });
  stations.push({ id: 'window', kind: 'window', x: 1066, y, w: 190, h, label: 'Serving Window', sub: 'serve the plate!' });
  stations.push({ id: 'trash', kind: 'trash', x: 24, y: 578, w: 104, h: 80, label: 'Trash', sub: 'toss it' });
  return stations;
}

export function stationById(stations, id) {
  return stations.find((s) => s.id === id) || null;
}

// Nearest station whose expanded box contains the chef (or null).
export function nearestStation(stations, cx, cy, pad = 52) {
  let best = null;
  let bestD = Infinity;
  for (const s of stations) {
    const nx = Math.max(s.x, Math.min(cx, s.x + s.w));
    const ny = Math.max(s.y, Math.min(cy, s.y + s.h));
    const d = Math.hypot(cx - nx, cy - ny);
    if (d <= pad + 18 && d < bestD) { best = s; bestD = d; }
  }
  return best;
}

function drawWoodCounter(ctx, x, y, w, h) {
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#a9743c';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 14, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 14 + i * 12);
    ctx.lineTo(x + w - 6, y + 14 + i * 12);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5d3a17';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.stroke();
}

function drawLabel(ctx, text, cx, y, size = 13, color = '#fff', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y);
}

export function drawKitchen(ctx, state, t) {
  const { stations, board, grill, assembly } = state;
  const W = KITCHEN.width;

  // Checkered floor.
  const tile = 64;
  for (let yy = KITCHEN.floorTop; yy < KITCHEN.height; yy += tile) {
    for (let xx = 0; xx < W; xx += tile) {
      const even = ((xx / tile) + (yy / tile)) % 2 === 0;
      ctx.fillStyle = even ? '#f6e3c0' : '#eecfa5';
      ctx.fillRect(xx, yy, tile, tile);
    }
  }
  // Warm wall band behind the counters.
  ctx.fillStyle = '#c96f3f';
  ctx.fillRect(0, KITCHEN.floorTop, W, 12);
  ctx.fillStyle = '#f7ead2';
  ctx.fillRect(0, KITCHEN.floorTop, W, 4);

  // Stations.
  for (const s of stations) {
    if (s.kind === 'trash') continue; // drawn separately below
    drawWoodCounter(ctx, s.x, s.y, s.w, s.h);
    drawLabel(ctx, s.label, s.x + s.w / 2, s.y + s.h + 14, 13, '#5d3a17');
    drawLabel(ctx, s.sub, s.x + s.w / 2, s.y + s.h + 30, 10, '#8a6a45', 'normal');
  }

  // Crates: a pile of the ingredient in each crate.
  for (const s of stations) {
    if (s.kind !== 'crate') continue;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2 + 8, s.w / 2 - 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFood(ctx, s.gives, s.x + s.w / 2 - 14, s.y + s.h / 2, 15, t);
    drawFood(ctx, s.gives, s.x + s.w / 2 + 16, s.y + s.h / 2 + 2, 13, t + 1);
    drawFood(ctx, s.gives, s.x + s.w / 2 + 2, s.y + s.h / 2 - 12, 11, t + 2);
  }

  // Chopping board.
  const boardSt = stationById(stations, 'board');
  ctx.fillStyle = '#e8c98f';
  ctx.beginPath();
  ctx.roundRect(boardSt.x + 10, boardSt.y + 8, boardSt.w - 20, boardSt.h - 16, 6);
  ctx.fill();
  ctx.strokeStyle = '#b08d4f';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (board.item) {
    drawFood(ctx, board.item, boardSt.x + boardSt.w / 2, boardSt.y + boardSt.h / 2, 17, t);
    if (board.progress > 0 && board.progress < 1) {
      const bw = 74;
      const bx = boardSt.x + boardSt.w / 2 - bw / 2;
      const by = boardSt.y + boardSt.h - 6;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = '#ffb020';
      ctx.fillRect(bx, by, bw * board.progress, 8);
      drawLabel(ctx, 'CHOPPING…', boardSt.x + boardSt.w / 2, boardSt.y - 8, 11, '#7a4a00');
    }
  } else {
    drawLabel(ctx, '— empty —', boardSt.x + boardSt.w / 2, boardSt.y + boardSt.h / 2, 11, '#8a6a45', 'normal');
  }

  // Grill: dark grate, two slots, steam, cook bars.
  const grillSt = stationById(stations, 'grill');
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.roundRect(grillSt.x + 8, grillSt.y + 6, grillSt.w - 16, grillSt.h - 12, 8);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(grillSt.x + 8 + i * ((grillSt.w - 16) / 5), grillSt.y + 8);
    ctx.lineTo(grillSt.x + 8 + i * ((grillSt.w - 16) / 5), grillSt.y + grillSt.h - 8);
    ctx.stroke();
  }
  grill.slots.forEach((slot, i) => {
    const sx = grillSt.x + 42 + i * 84;
    const sy = grillSt.y + grillSt.h / 2;
    if (slot.item) {
      drawFood(ctx, slot.item === 'patty_burnt' ? 'patty_burnt' : (slot.t >= 6 ? 'patty_grilled' : 'patty'), sx, sy, 16, t);
      if (slot.t >= 6 && slot.item !== 'patty_burnt') drawSteam(ctx, sx, sy - 18, t + i, 2);
      // Cook bar: green while perfect, red once burnt.
      const bw = 56;
      const frac = Math.min(1, slot.t / 11);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(sx - bw / 2, grillSt.y + grillSt.h - 4, bw, 6);
      ctx.fillStyle = slot.item === 'patty_burnt' ? '#e23b2e' : (slot.t >= 6 ? '#7cc24f' : '#ffb020');
      ctx.fillRect(sx - bw / 2, grillSt.y + grillSt.h - 4, bw * frac, 6);
      if (slot.t >= 6 && slot.item !== 'patty_burnt') drawLabel(ctx, 'READY!', sx, grillSt.y - 8, 11, '#2c7a1e');
      if (slot.item === 'patty_burnt') drawLabel(ctx, 'BURNT!', sx, grillSt.y - 8, 11, '#c22a1a');
    } else {
      drawLabel(ctx, 'slot ' + (i + 1), sx, sy, 10, '#b0b0b0', 'normal');
    }
  });

  // Assembly counter: the plate being built.
  const asmSt = stationById(stations, 'assembly');
  if (assembly.plate) {
    drawPlate(ctx, asmSt.x + asmSt.w / 2, asmSt.y + asmSt.h / 2, 26, assembly.plate, t);
    if (assembly.plate.length > 0) {
      drawLabel(ctx, `${assembly.plate.length} item${assembly.plate.length > 1 ? 's' : ''} on plate`, asmSt.x + asmSt.w / 2, asmSt.y - 8, 11, '#7a4a00');
    }
  }

  // Serving window: warm glow + bell.
  const winSt = stationById(stations, 'window');
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.roundRect(winSt.x + 10, winSt.y + 8, winSt.w - 20, winSt.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#b57a2a';
  ctx.beginPath();
  ctx.arc(winSt.x + winSt.w / 2, winSt.y + winSt.h / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(winSt.x + winSt.w / 2, winSt.y + winSt.h / 2 - 3, 7, 0, Math.PI * 2);
  ctx.fill();
  drawLabel(ctx, 'DING! serve here', winSt.x + winSt.w / 2, winSt.y + winSt.h / 2 + 22, 10, '#7a4a00', 'normal');

  // Trash bin.
  const trashSt = stationById(stations, 'trash');
  ctx.fillStyle = '#5a6b7a';
  ctx.beginPath();
  ctx.roundRect(trashSt.x + 14, trashSt.y + 10, trashSt.w - 28, trashSt.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#46565f';
  ctx.fillRect(trashSt.x + 8, trashSt.y + 4, trashSt.w - 16, 12);
  drawLabel(ctx, trashSt.label, trashSt.x + trashSt.w / 2, trashSt.y + trashSt.h + 12, 13, '#5d3a17');
  drawLabel(ctx, trashSt.sub, trashSt.x + trashSt.w / 2, trashSt.y + trashSt.h + 28, 10, '#8a6a45', 'normal');

  // Highlight the station the chef is near.
  if (state.nearStation) {
    const s = state.nearStation;
    ctx.strokeStyle = '#ffb020';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.roundRect(s.x - 5, s.y - 5, s.w + 10, s.h + 10, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(ctx, 'E — use', s.x + s.w / 2, s.y + s.h + 46, 12, '#7a4a00');
  }
}
