// world.js — grid parsing and tile queries for Midnight Vault: The Heist.
import { TILE, COLS, ROWS } from './config.js';

// A parsed level: a grid of tile chars plus the interesting points.
export function parseLevel(def) {
  const grid = def.map.map((row) => row.split(''));
  const loot = [];
  const guards = [];
  const cameras = [];
  const panels = [];
  let playerStart = null;
  let exit = null;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (c === 'L') loot.push({ tx: x, ty: y, taken: false });
      else if (c === 'P') playerStart = { tx: x, ty: y };
      else if (c === 'E') exit = { tx: x, ty: y };
      else if (c === 'G') guards.push({ tx: x, ty: y });
      else if (c === 'K') cameras.push({ tx: x, ty: y });
      else if (c === 'X') panels.push({ tx: x, ty: y });
    }
  }
  return { def, grid, loot, playerStart, exit, guards, cameras, panels };
}

export function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return world.grid[ty][tx];
}

export function isWall(world, tx, ty) {
  return tileAt(world, tx, ty) === '#';
}

export function isCover(world, tx, ty) {
  return tileAt(world, tx, ty) === 'C';
}

// Solid for movement: walls and cover block the player and the guards.
export function isSolid(world, tx, ty) {
  const c = tileAt(world, tx, ty);
  return c === '#' || c === 'C';
}

// Blocks line of sight: walls and tall cover.
export function blocksSight(world, tx, ty) {
  const c = tileAt(world, tx, ty);
  return c === '#' || c === 'C';
}

export function isShadow(world, tx, ty) {
  return tileAt(world, tx, ty) === '~';
}

export function isLight(world, tx, ty) {
  return tileAt(world, tx, ty) === '*';
}

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export function pixelToTile(px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

// Line of sight between two pixel points: sample along the segment and
// refuse when any sample lands in a sight-blocking tile.
export function hasLineOfSight(world, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { tx, ty } = pixelToTile(ax + dx * t, ay + dy * t);
    if (blocksSight(world, tx, ty)) return false;
  }
  return true;
}

// Circle (px, py, radius) against solid tiles: true when it overlaps one.
export function circleHitsSolid(world, px, py, radius) {
  const minTx = Math.floor((px - radius) / TILE);
  const maxTx = Math.floor((px + radius) / TILE);
  const minTy = Math.floor((py - radius) / TILE);
  const maxTy = Math.floor((py + radius) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isSolid(world, tx, ty)) continue;
      const left = tx * TILE;
      const top = ty * TILE;
      const cx = Math.max(left, Math.min(px, left + TILE));
      const cy = Math.max(top, Math.min(py, top + TILE));
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
}
