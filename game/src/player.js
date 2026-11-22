// player.js — Shade, the thief: movement, sneaking, coins, loot, exit.
import {
  TILE,
  COLS,
  ROWS,
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  COIN_FLY_TIME,
  LOOT_PICKUP_DIST,
  EXIT_TILE_DIST,
  dist,
} from './config.js';
import { tileCenter, circleHitsSolid, pixelToTile, isShadow, isLight } from './world.js';

export function makePlayer(startTile) {
  const pos = tileCenter(startTile.tx, startTile.ty);
  return {
    x: pos.x,
    y: pos.y,
    radius: PLAYER_RADIUS,
    facing: 0, // radians; 0 = facing right
    moving: false,
    sneaking: false,
    stepPhase: 0, // advances with distance walked, drives footstep sounds
    coin: null, // { sx, sy, tx, ty, t, landed } while a coin is flying / lying
    disableProgress: 0, // 0..1 while holding E at a panel
  };
}

// Move the player by (dx, dy) for dt seconds, sliding along solid tiles.
export function movePlayer(player, world, dx, dy, dt) {
  const nx = player.x + dx * dt;
  if (!circleHitsSolid(world, nx, player.y, player.radius)) player.x = nx;
  const ny = player.y + dy * dt;
  if (!circleHitsSolid(world, player.x, ny, player.radius)) player.y = ny;
  player.x = Math.max(player.radius, Math.min(COLS * TILE - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(ROWS * TILE - player.radius, player.y));
}

export function updatePlayer(player, world, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.moving = mx !== 0 || my !== 0;
  player.sneaking = !!input.sneak;
  if (player.moving) {
    const len = Math.sqrt(mx * mx + my * my);
    mx /= len;
    my /= len;
    const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    movePlayer(player, world, mx * speed, my * speed, dt);
    player.facing = Math.atan2(my, mx);
    player.stepPhase += speed * dt;
  }
  // Coin flight: the tossed coin arcs to its target tile, then lies there.
  if (player.coin && !player.coin.landed) {
    player.coin.t += dt / COIN_FLY_TIME;
    if (player.coin.t >= 1) {
      player.coin.t = 1;
      player.coin.landed = true;
    }
  }
}

// Toss a coin toward the clicked pixel point. Returns true when a coin was
// actually thrown (coins left and no coin already in flight).
export function tossCoin(player, coinsLeft, px, py) {
  if (coinsLeft <= 0) return false;
  if (player.coin && !player.coin.landed) return false;
  const tx = Math.max(TILE / 2, Math.min(COLS * TILE - TILE / 2, px));
  const ty = Math.max(TILE / 2, Math.min(ROWS * TILE - TILE / 2, py));
  player.coin = { sx: player.x, sy: player.y, tx, ty, t: 0, landed: false };
  return true;
}

export function coinPosition(player) {
  const c = player.coin;
  if (!c) return null;
  if (c.landed) return { x: c.tx, y: c.ty, height: 0 };
  const x = c.sx + (c.tx - c.sx) * c.t;
  const y = c.sy + (c.ty - c.sy) * c.t;
  // A little hop: up in the middle of the flight, back down at the end.
  const height = Math.sin(c.t * Math.PI) * 18;
  return { x, y, height };
}

// Pick up any loot within reach. Returns how many were taken this tick.
export function collectLoot(player, world) {
  let taken = 0;
  for (const item of world.loot) {
    if (item.taken) continue;
    const pos = tileCenter(item.tx, item.ty);
    if (dist(player.x, player.y, pos.x, pos.y) <= LOOT_PICKUP_DIST) {
      item.taken = true;
      taken++;
    }
  }
  return taken;
}

export function lootRemaining(world) {
  return world.loot.filter((l) => !l.taken).length;
}

export function lootCollected(world) {
  return world.loot.filter((l) => l.taken).length;
}

// True when the player stands on the exit tile and all loot is collected.
export function atExit(player, world) {
  if (lootRemaining(world) > 0) return false;
  const pos = tileCenter(world.exit.tx, world.exit.ty);
  return dist(player.x, player.y, pos.x, pos.y) <= EXIT_TILE_DIST;
}

// Where the player stands right now: shadow, light, or plain floor.
export function playerGround(player, world) {
  const { tx, ty } = pixelToTile(player.x, player.y);
  if (isShadow(world, tx, ty)) return 'shadow';
  if (isLight(world, tx, ty)) return 'light';
  return 'floor';
}
