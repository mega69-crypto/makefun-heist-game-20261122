// main.js — game loop and state machine for Midnight Vault: The Heist.
import { LEVELS } from './levels.js';
import {
  TILE,
  COLS,
  ROWS,
  HUD_H,
  LIVES_START,
  COINS_START,
  COINS_PER_LOOT,
  ALARM_MAX,
  ALARM_FILL_GUARD,
  ALARM_FILL_CAMERA,
  ALARM_DRAIN,
  ALARM_CLOSE_MULT,
  ALARM_LIGHT_MULT,
  ALARM_SHADOW_MULT,
  ALARM_SNEAK_MULT,
  PANEL_DISABLE_TIME,
  PANEL_RADIUS,
  PANEL_NOISE_RADIUS,
  COIN_NOISE_RADIUS,
  GUARD_CATCH_DIST,
  dist,
} from './config.js';
import { parseLevel, tileCenter, pixelToTile } from './world.js';
import { makeGuard, updateGuard, guardInvestigate } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import {
  makePlayer,
  updatePlayer,
  tossCoin,
  collectLoot,
  atExit,
  playerGround,
  lootRemaining,
} from './player.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { render, canvasSize } from './render.js';
import { shotFromUrl, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const size = canvasSize();
canvas.width = size.width;
canvas.height = size.height;

const input = makeInput(canvas);
const audio = makeAudio();

const state = {
  screen: 'title', // title | playing | paused | levelcomplete | caught | gameover | victory
  levelIndex: 0,
  world: null,
  player: null,
  guards: [],
  cameras: [],
  alarm: 0,
  alarmed: false,
  coins: COINS_START,
  lives: LIVES_START,
  levelTime: 0,
  totalTime: 0,
  score: 0,
  levelScore: 0,
  panelProgress: 0,
  time: 0,
  caughtTimer: 0,
  lastStepPhase: 0,
  coinClinked: false,
  shot: null,
};

function loadLevel(index) {
  const def = LEVELS[index];
  state.levelIndex = index;
  state.world = parseLevel(def);
  state.player = makePlayer(state.world.playerStart);
  state.guards = def.guards.map((g, i) => makeGuard(g, i));
  state.cameras = def.cameras.map((c, i) => makeCamera(c, i));
  state.alarm = 0;
  state.alarmed = false;
  state.coins = COINS_START;
  state.levelTime = 0;
  state.levelScore = 0;
  state.panelProgress = 0;
  state.coinClinked = false;
}

function levelName() {
  return LEVELS[state.levelIndex].name;
}

function parTime() {
  return LEVELS[state.levelIndex].par;
}

function startGame() {
  state.lives = LIVES_START;
  state.score = 0;
  state.totalTime = 0;
  loadLevel(0);
  state.screen = 'playing';
  audio.unlock();
  audio.startHum();
}

function nextLevel() {
  if (state.levelIndex + 1 >= LEVELS.length) {
    state.screen = 'victory';
    audio.levelComplete();
    audio.stopHum();
    return;
  }
  loadLevel(state.levelIndex + 1);
  state.screen = 'playing';
}

function levelComplete() {
  const par = parTime();
  state.levelScore = 1000 + Math.max(0, Math.round((par - state.levelTime) * 10)) + state.lives * 100;
  state.score += state.levelScore;
  state.screen = 'levelcomplete';
  audio.levelComplete();
}

function caught() {
  state.lives -= 1;
  state.screen = 'caught';
  state.caughtTimer = 1.8;
  audio.caught();
  audio.stopHum();
}

function updatePlaying(dt) {
  state.time += dt;
  state.levelTime += dt;
  state.totalTime += dt;

  const player = state.player;
  const world = state.world;

  updatePlayer(player, world, input, dt);

  // Footstep sounds, timed to distance walked.
  const stride = 30;
  if (player.moving && player.stepPhase - state.lastStepPhase >= stride) {
    state.lastStepPhase = player.stepPhase;
    audio.footstep(player.sneaking);
  }

  // Cameras sweep; guards patrol, investigate, or chase.
  for (const cam of state.cameras) {
    updateCamera(cam, world, dt, state.time, player.x, player.y);
  }
  for (const guard of state.guards) {
    updateGuard(guard, world, dt, {
      px: player.x,
      py: player.y,
      alarm: state.alarm,
      alarmed: state.alarmed,
      time: state.time,
    });
  }

  // Alarm: fills while seen, drains while hidden.
  let seenByGuard = false;
  let seenByCamera = false;
  let closestSeen = Infinity;
  for (const guard of state.guards) {
    if (guard.seesPlayer) {
      seenByGuard = true;
      closestSeen = Math.min(closestSeen, dist(guard.x, guard.y, player.x, player.y));
    }
  }
  for (const cam of state.cameras) {
    if (cam.seesPlayer) {
      seenByCamera = true;
      closestSeen = Math.min(closestSeen, dist(cam.x, cam.y, player.x, player.y));
    }
  }
  if (seenByGuard || seenByCamera) {
    let rate = 0;
    if (seenByGuard) rate += ALARM_FILL_GUARD;
    if (seenByCamera) rate += ALARM_FILL_CAMERA;
    if (closestSeen < 2.5 * TILE) rate *= ALARM_CLOSE_MULT;
    const ground = playerGround(player, world);
    if (ground === 'light') rate *= ALARM_LIGHT_MULT;
    if (ground === 'shadow') rate *= ALARM_SHADOW_MULT;
    if (player.sneaking) rate *= ALARM_SNEAK_MULT;
    state.alarm += rate * dt;
  } else {
    state.alarm -= ALARM_DRAIN * dt;
  }
  state.alarm = Math.max(0, Math.min(ALARM_MAX, state.alarm));
  if (!state.alarmed && state.alarm >= ALARM_MAX) {
    state.alarmed = true;
    audio.alarm();
  } else if (state.alarmed && state.alarm < 35) {
    state.alarmed = false;
    for (const guard of state.guards) {
      if (guard.state === 'chase') {
        guard.state = 'investigate';
        guard.stateTime = 0;
        guard.investigateX = player.x;
        guard.investigateY = player.y;
      }
    }
  }

  // Coin toss on click (clicks land on the canvas; subtract the HUD bar).
  if (input.click) {
    const cy = input.click.y - HUD_H;
    if (cy >= 0 && cy <= ROWS * TILE) {
      if (tossCoin(player, state.coins, input.click.x, cy)) {
        state.coins -= 1;
        state.coinClinked = false;
      }
    }
  }
  // The coin just landed: clink, and the nearest guard comes to look.
  if (player.coin && player.coin.landed && !state.coinClinked) {
    state.coinClinked = true;
    audio.clink();
    let nearest = null;
    let nearestD = Infinity;
    for (const guard of state.guards) {
      const d = dist(guard.x, guard.y, player.coin.tx, player.coin.ty);
      if (d < nearestD) {
        nearestD = d;
        nearest = guard;
      }
    }
    if (nearest && nearestD <= COIN_NOISE_RADIUS) {
      guardInvestigate(nearest, player.coin.tx, player.coin.ty);
    }
  }

  // Camera panel: hold E while standing next to a panel.
  let nearPanel = null;
  for (const panel of world.panels) {
    const pos = tileCenter(panel.tx, panel.ty);
    if (dist(player.x, player.y, pos.x, pos.y) <= PANEL_RADIUS) nearPanel = pos;
  }
  const anyCameraOn = state.cameras.some((c) => !c.disabled);
  if (nearPanel && input.interact && anyCameraOn) {
    state.panelProgress += dt / PANEL_DISABLE_TIME;
    if (state.panelProgress >= 1) {
      state.panelProgress = 0;
      for (const cam of state.cameras) cam.disabled = true;
      audio.panelDone();
      for (const guard of state.guards) {
        if (dist(guard.x, guard.y, nearPanel.x, nearPanel.y) <= PANEL_NOISE_RADIUS) {
          guardInvestigate(guard, nearPanel.x, nearPanel.y);
        }
      }
    }
  } else {
    state.panelProgress = Math.max(0, state.panelProgress - dt * 2);
  }

  // Loot pickup.
  const taken = collectLoot(player, world);
  if (taken > 0) {
    state.coins += taken * COINS_PER_LOOT;
    audio.pickup();
  }

  // Caught: a guard touches the player while the alarm is sounding.
  if (state.alarmed) {
    for (const guard of state.guards) {
      if (dist(guard.x, guard.y, player.x, player.y) <= GUARD_CATCH_DIST) {
        caught();
        return;
      }
    }
  }

  // Exit: all loot collected and the player reaches the getaway van.
  if (atExit(player, world)) {
    levelComplete();
  }
}

function update(dt) {
  if (input.mutePressed) {
    state.muted = audio.toggleMute();
  }

  if (state.screen === 'title') {
    state.time += dt;
    if (input.confirmPressed || input.click) {
      startGame();
    }
  } else if (state.screen === 'playing') {
    if (input.pausePressed) {
      state.screen = 'paused';
      audio.stopHum();
    } else {
      updatePlaying(dt);
    }
  } else if (state.screen === 'paused') {
    if (input.pausePressed) {
      state.screen = 'playing';
      audio.startHum();
    }
  } else if (state.screen === 'levelcomplete') {
    state.time += dt;
    if (input.confirmPressed) nextLevel();
  } else if (state.screen === 'caught') {
    state.caughtTimer -= dt;
    if (state.caughtTimer <= 0) {
      if (state.lives > 0) {
        loadLevel(state.levelIndex);
        state.screen = 'playing';
        audio.startHum();
      } else {
        state.screen = 'gameover';
      }
    }
  } else if (state.screen === 'gameover') {
    if (input.confirmPressed) startGame();
  } else if (state.screen === 'victory') {
    if (input.confirmPressed) startGame();
  }

  input.consumeOneShots();
}

// Fixed-timestep loop: 60 updates per second, render each frame.
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;
function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  let guard = 0;
  while (acc >= STEP && guard < 5) {
    update(STEP);
    acc -= STEP;
    guard++;
  }
  if (guard === 5) acc = 0;
  render(ctx, {
    world: state.world,
    player: state.player,
    guards: state.guards,
    cameras: state.cameras,
    alarm: state.alarm,
    alarmed: state.alarmed,
    coins: state.coins,
    lives: state.lives,
    levelName: levelName(),
    levelTime: state.levelTime,
    par: parTime(),
    muted: state.muted,
    state: state.screen,
    time: state.time,
    totalTime: state.totalTime,
    score: state.score,
    levelScore: state.levelScore,
    panelProgress: state.panelProgress,
    levelIndex: state.levelIndex,
  });
  requestAnimationFrame(frame);
}

// Boot: load level 0, apply a deterministic screenshot state if requested.
loadLevel(0);
state.shot = shotFromUrl();
if (state.shot) applyShot(state, state.shot);
// Exposed for automated checks (screenshots, smoke tests).
window.__game = state;
requestAnimationFrame(frame);
