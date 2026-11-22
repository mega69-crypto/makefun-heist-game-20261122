// config.js — tuning constants and shared helpers for Midnight Vault: The Heist.
// Every number here was chosen for this game only.

export const TILE = 40; // pixels per tile
export const HUD_H = 64; // pixels of HUD bar above the map
export const COLS = 24;
export const ROWS = 15;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 148; // px per second
export const PLAYER_SNEAK_SPEED = 84; // px per second while Shift is held
export const PLAYER_RUN_MULT = 1.0; // no sprint: walking is the fast move

export const GUARD_RADIUS = 14;
export const CONE_RANGE = 5.2 * TILE; // guard vision range in px
export const CONE_HALF_ANGLE = (36 * Math.PI) / 180; // ~72 degree full cone
export const CAMERA_RANGE = 5.6 * TILE;
export const CAMERA_HALF_ANGLE = (30 * Math.PI) / 180;

export const ALARM_MAX = 100;
export const ALARM_FILL_GUARD = 26; // per second while seen by a guard
export const ALARM_FILL_CAMERA = 34; // per second while seen by a camera
export const ALARM_DRAIN = 13; // per second while hidden
export const ALARM_CLOSE_MULT = 1.5; // player closer than 2.5 tiles
export const ALARM_LIGHT_MULT = 1.3; // standing in a spotlight pool
export const ALARM_SHADOW_MULT = 0.5; // standing in shadow
export const ALARM_SNEAK_MULT = 0.7; // sneaking
export const ALARM_SUSPICIOUS_AT = 35; // guard goes suspicious above this
export const ALARM_CHASE_AT = 100; // alarm sounds, guards chase

export const LIVES_START = 3;
export const COINS_START = 5;
export const COINS_PER_LOOT = 1;
export const COIN_FLY_TIME = 0.32; // seconds the tossed coin is in the air
export const COIN_NOISE_RADIUS = 6.5 * TILE; // guards inside this hear the clink

export const PANEL_DISABLE_TIME = 2.0; // seconds holding E next to a panel
export const PANEL_RADIUS = 1.4 * TILE; // how close the player must stand
export const PANEL_NOISE_RADIUS = 6 * TILE; // guards inside this investigate the panel

export const GUARD_SUSPICIOUS_PAUSE = 0.9; // seconds a guard stares when suspicious
export const GUARD_INVESTIGATE_LOOK = 2.2; // seconds a guard looks around at a noise
export const GUARD_CHASE_SPEED_MULT = 1.55;
export const GUARD_CATCH_DIST = 26; // px: guard touches player while alarmed

export const LOOT_PICKUP_DIST = 22; // px
export const EXIT_TILE_DIST = 0.6 * TILE; // px from exit centre to finish

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// Smallest absolute angle between two headings, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Deterministic pseudo-random from an integer seed (mulberry32). Used only
// for cosmetic variation that must be identical on every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
