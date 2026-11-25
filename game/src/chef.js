// chef.js — the chef: movement, carrying, and how they look.
// One clear job: the little cook running around the kitchen.

import { KITCHEN, nearestStation } from './kitchen.js';
import { drawFood, drawPlate } from './draw.js';

export function createChef() {
  return {
    x: 640, y: 470, radius: KITCHEN.chefRadius,
    dirX: 0, dirY: 1, moving: false, walkPhase: 0,
    // carry: null | { kind: 'item', id } | { kind: 'plate', items: [] }
    carry: null,
  };
}

export function updateChef(chef, input, dt, stations) {
  const v = input.moveVector();
  chef.moving = v.x !== 0 || v.y !== 0;
  if (chef.moving) {
    chef.dirX = v.x;
    chef.dirY = v.y;
    chef.walkPhase += dt * 11;
  }
  const speed = KITCHEN.chefSpeed;
  chef.x += v.x * speed * dt;
  chef.y += v.y * speed * dt;
  // Keep the chef on the floor, below the counters, inside the room.
  const top = KITCHEN.counterY + KITCHEN.counterH + chef.radius + 26;
  chef.x = Math.max(chef.radius + 8, Math.min(KITCHEN.width - chef.radius - 8, chef.x));
  chef.y = Math.max(top, Math.min(KITCHEN.height - chef.radius - 10, chef.y));
  return nearestStation(stations, chef.x, chef.y);
}

export function drawChef(ctx, chef, t) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : Math.sin(t * 2) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + chef.radius + 4, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: white apron over a warm shirt.
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.arc(x, y + 6, chef.radius - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 13, y - 2, 26, 24, 8);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(x - 13, y + 12, 26, 3);

  // Head + chef hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x, y - chef.radius + 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 8, y - chef.radius - 8, 8, 0, Math.PI * 2);
  ctx.arc(x, y - chef.radius - 12, 9, 0, Math.PI * 2);
  ctx.arc(x + 8, y - chef.radius - 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 13, y - chef.radius - 8, 26, 7);
  // Eyes look toward movement.
  const ex = chef.dirX * 3;
  const ey = chef.dirY * 2;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 5 + ex, y - chef.radius + 2 + ey, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + ex, y - chef.radius + 2 + ey, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Smile.
  ctx.strokeStyle = '#7a4a2a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + ex, y - chef.radius + 6 + ey, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // What the chef carries, held up front.
  if (chef.carry) {
    const cy = y + chef.radius + 14;
    if (chef.carry.kind === 'plate') {
      drawPlate(ctx, x, cy, 20, chef.carry.items, t);
    } else {
      drawFood(ctx, chef.carry.id, x, cy, 15, t);
    }
  }
}
