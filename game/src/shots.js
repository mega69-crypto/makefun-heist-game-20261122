// shots.js — deterministic screenshot states for Midnight Vault: The Heist.
// Reads the URL query ?shot=start|play|end (and &seed=, ignored) and forces a
// fixed, reproducible game state. No randomness is used in any shot state,
// so the screenshots can be re-taken byte-for-byte identical in layout.
import { LEVELS } from './levels.js';
import { tileCenter } from './world.js';

export function shotFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot === 'start' || shot === 'play' || shot === 'end') return shot;
  } catch (err) {
    // No URL to read (non-browser context): no shot state.
  }
  return null;
}

// Mutate `state` (the live game state object from main.js) into the shot.
// The caller has already loaded level 0 with loadLevel(0).
export function applyShot(state, kind) {
  if (kind === 'start') {
    // Title screen over the level: guards on their first waypoints, the
    // thief at the door, alarm empty. This is the loaded level's natural
    // state; just make sure the screen is the title.
    state.screen = 'title';
    state.alarm = 0;
    state.alarmed = false;
    return;
  }

  if (kind === 'play') {
    // Mid-heist: the thief crouched in shadow behind a crate, one guard's
    // cone sweeping close by, the alarm half full, one loot already taken.
    state.screen = 'playing';
    state.alarm = 75;
    state.alarmed = false;
    state.coins = 4;
    const hideout = tileCenter(6, 6);
    state.player.x = hideout.x;
    state.player.y = hideout.y;
    state.player.facing = Math.PI / 2;
    state.player.sneaking = true;
    // Guard 0 mid-patrol, facing down-left toward the thief's corner.
    const g0 = tileCenter(9, 5);
    state.guards[0].x = g0.x;
    state.guards[0].y = g0.y;
    state.guards[0].angle = 2.0;
    state.guards[0].state = 'patrol';
    // Guard 1 on the far side, patrolling the right wing.
    const g1 = tileCenter(17, 9);
    state.guards[1].x = g1.x;
    state.guards[1].y = g1.y;
    state.guards[1].angle = Math.PI;
    state.guards[1].state = 'patrol';
    // One loot already pocketed.
    state.world.loot[0].taken = true;
    state.levelTime = 42;
    return;
  }

  if (kind === 'end') {
    // Getaway: all loot collected, the thief at the van, level complete.
    state.screen = 'levelcomplete';
    state.alarm = 0;
    state.alarmed = false;
    state.coins = 6;
    for (const item of state.world.loot) item.taken = true;
    const van = tileCenter(state.world.exit.tx, state.world.exit.ty);
    state.player.x = van.x;
    state.player.y = van.y;
    state.player.facing = -Math.PI / 2;
    state.levelTime = 68;
    state.levelScore = 1000 + Math.max(0, Math.round((LEVELS[state.levelIndex].par - 68) * 10)) + state.lives * 100;
    state.score = state.levelScore;
    return;
  }
}
