// draw.js — canvas art helpers for food and plates.
// One clear job: draw every edible thing so it looks worth serving.
// Everything here is plain canvas shapes; no images, no assets.

import { INGREDIENTS } from './recipes.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// Draw one ingredient at (cx, cy) with radius ~r. `t` animates wobble/steam.
export function drawFood(ctx, id, cx, cy, r, t = 0) {
  const wob = Math.sin(t * 3 + cx) * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wob);
  switch (id) {
    case 'tomato': {
      circle(ctx, 0, 0, r, '#e23b2e');
      circle(ctx, -r * 0.35, -r * 0.3, r * 0.45, '#ef6a4d');
      ctx.fillStyle = '#3c7a22';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(-r * 0.35, -r * 1.05);
      ctx.lineTo(r * 0.1, -r * 0.85);
      ctx.lineTo(r * 0.4, -r * 1.0);
      ctx.lineTo(r * 0.15, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'tomato_chopped': {
      roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.4, '#ef6a4d');
      circle(ctx, 0, 0, r * 0.55, '#f58a6a');
      circle(ctx, 0, 0, r * 0.25, '#ffd9c9');
      ctx.strokeStyle = '#c23a22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'lettuce': {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        ellipse(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.62, r * 0.45, i % 2 ? '#6db844' : '#5da83c');
      }
      circle(ctx, 0, 0, r * 0.5, '#8fce5f');
      break;
    }
    case 'lettuce_chopped': {
      ctx.fillStyle = '#7cc24f';
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.55, r * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#4c8a2c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.lineTo(r * 0.7, 0);
      ctx.stroke();
      break;
    }
    case 'patty': {
      ellipse(ctx, 0, 0, r * 1.05, r * 0.72, '#c46a4a');
      ellipse(ctx, 0, -r * 0.12, r * 0.9, r * 0.55, '#d97f5e');
      ctx.fillStyle = '#a34d33';
      for (let i = -1; i <= 1; i++) {
        circle(ctx, i * r * 0.45, r * 0.1, r * 0.1, '#a34d33');
      }
      break;
    }
    case 'patty_grilled': {
      ellipse(ctx, 0, 0, r * 1.05, r * 0.72, '#7a4a26');
      ctx.strokeStyle = '#4d2c14';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.4 - r * 0.25, -r * 0.45);
        ctx.lineTo(i * r * 0.4 + r * 0.25, r * 0.45);
        ctx.stroke();
      }
      break;
    }
    case 'patty_burnt': {
      ellipse(ctx, 0, 0, r * 1.05, r * 0.72, '#241a12');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.3);
      ctx.lineTo(r * 0.6, r * 0.3);
      ctx.moveTo(r * 0.6, -r * 0.3);
      ctx.lineTo(-r * 0.6, r * 0.3);
      ctx.stroke();
      break;
    }
    case 'bun': {
      ellipse(ctx, 0, r * 0.18, r * 1.05, r * 0.5, '#d98f3a');
      ellipse(ctx, 0, -r * 0.18, r * 1.0, r * 0.62, '#f0b45e');
      ctx.fillStyle = '#fff3d6';
      circle(ctx, -r * 0.4, -r * 0.35, r * 0.09, '#fff3d6');
      circle(ctx, 0, -r * 0.5, r * 0.09, '#fff3d6');
      circle(ctx, r * 0.4, -r * 0.35, r * 0.09, '#fff3d6');
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.55);
      ctx.lineTo(r, r * 0.55);
      ctx.lineTo(r * 0.55, -r * 0.55);
      ctx.lineTo(-r * 0.55, -r * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d19a1d';
      circle(ctx, -r * 0.25, r * 0.15, r * 0.14, '#d19a1d');
      circle(ctx, r * 0.3, r * 0.2, r * 0.11, '#d19a1d');
      break;
    }
    default: {
      circle(ctx, 0, 0, r, (INGREDIENTS[id] || {}).color || '#999');
    }
  }
  ctx.restore();
}

// A white plate, optionally stacked with the dish's items.
export function drawPlate(ctx, cx, cy, r, items = [], t = 0) {
  circle(ctx, cx, cy, r, '#ffffff');
  ctx.strokeStyle = '#d8cdb8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#b8ab90';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (items.length === 0) return;
  // Stack the dish: bottom item first, each slightly higher.
  const n = items.length;
  items.forEach((id, i) => {
    const lift = (n - 1 - i) * r * 0.16;
    drawFood(ctx, id, cx, cy - lift, r * 0.62, t);
  });
}

// Little wavy steam puff above (x, y).
export function drawSteam(ctx, x, y, t, amount = 3) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < amount; i++) {
    const ph = t * 1.6 + i * 2.1;
    const sx = x + Math.sin(ph) * 6 + (i - 1) * 14;
    const sy = y - ((ph * 9) % 26);
    ctx.globalAlpha = 0.75 - ((ph * 9) % 26) / 34;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 5, sy - 7, sx - 2, sy - 13);
    ctx.stroke();
  }
  ctx.restore();
}
