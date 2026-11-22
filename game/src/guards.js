// guards.js — patrolling guards with vision cones for Midnight Vault: The Heist.
import {
  TILE,
  GUARD_RADIUS,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  GUARD_SUSPICIOUS_PAUSE,
  GUARD_INVESTIGATE_LOOK,
  GUARD_CHASE_SPEED_MULT,
  ALARM_SUSPICIOUS_AT,
  angleDiff,
  clamp,
  dist,
} from './config.js';
import { tileCenter, hasLineOfSight } from './world.js';

export function makeGuard(def, index) {
  const start = tileCenter(def.spawn[0], def.spawn[1]);
  const waypoints = def.waypoints.map(([tx, ty]) => tileCenter(tx, ty));
  return {
    index,
    x: start.x,
    y: start.y,
    speed: def.speed,
    waypoints,
    wpIndex: 1 % waypoints.length,
    // Facing: start by looking toward the next waypoint.
    angle: Math.atan2(waypoints[1 % waypoints.length].y - start.y, waypoints[1 % waypoints.length].x - start.x),
    state: 'patrol', // patrol | suspicious | investigate | chase
    stateTime: 0,
    investigateX: 0,
    investigateY: 0,
    seesPlayer: false,
    pauseLeft: 0,
  };
}

// True when the guard can currently see the player (range + cone + sight).
export function guardSeesPlayer(guard, world, px, py) {
  const d = dist(guard.x, guard.y, px, py);
  if (d > CONE_RANGE) return false;
  const ang = Math.atan2(py - guard.y, px - guard.x);
  if (angleDiff(ang, guard.angle) > CONE_HALF_ANGLE) return false;
  return hasLineOfSight(world, guard.x, guard.y, px, py);
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) return true;
  const step = Math.min(d, speed * dt);
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
  guard.angle = Math.atan2(dy, dx);
  return d <= speed * dt + 0.5;
}

export function updateGuard(guard, world, dt, ctx) {
  // ctx: { px, py, alarm, alarmed, time }
  guard.stateTime += dt;
  guard.seesPlayer = guardSeesPlayer(guard, world, ctx.px, ctx.py);

  if (ctx.alarmed) {
    // Alarm sounding: chase the player's last seen position.
    if (guard.state !== 'chase') {
      guard.state = 'chase';
      guard.stateTime = 0;
    }
    moveToward(guard, ctx.px, ctx.py, guard.speed * GUARD_CHASE_SPEED_MULT, dt);
    return;
  }

  switch (guard.state) {
    case 'patrol': {
      const target = guard.waypoints[guard.wpIndex];
      if (moveToward(guard, target.x, target.y, guard.speed, dt)) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = 0.35; // brief look-around at each waypoint
      }
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        guard.angle += Math.sin(ctx.time * 1.4 + guard.index * 2.1) * 0.35 * dt;
      }
      if (guard.seesPlayer && ctx.alarm >= ALARM_SUSPICIOUS_AT) {
        guard.state = 'suspicious';
        guard.stateTime = 0;
      }
      break;
    }
    case 'suspicious': {
      // Stare at the player, cone narrowed on them.
      guard.angle = Math.atan2(ctx.py - guard.y, ctx.px - guard.x);
      if (!guard.seesPlayer || guard.stateTime > GUARD_SUSPICIOUS_PAUSE) {
        guard.state = guard.seesPlayer ? 'chase' : 'patrol';
        guard.stateTime = 0;
        if (guard.state === 'chase') {
          guard.investigateX = ctx.px;
          guard.investigateY = ctx.py;
        }
      }
      break;
    }
    case 'investigate': {
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, guard.speed * 1.15, dt);
      if (arrived) {
        // Look around, then resume the patrol loop.
        guard.angle += Math.sin(ctx.time * 2.2 + guard.index) * 1.1 * dt;
        if (guard.stateTime > GUARD_INVESTIGATE_LOOK) {
          guard.state = 'patrol';
          guard.stateTime = 0;
        }
      }
      if (guard.seesPlayer && ctx.alarm >= ALARM_SUSPICIOUS_AT) {
        guard.state = 'suspicious';
        guard.stateTime = 0;
      }
      break;
    }
    case 'chase': {
      // Reached the last seen spot without the alarm sounding: go look.
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, guard.speed * GUARD_CHASE_SPEED_MULT, dt);
      if (arrived || guard.stateTime > 3.5) {
        guard.state = 'investigate';
        guard.stateTime = 0;
      }
      break;
    }
    default:
      guard.state = 'patrol';
  }
}

// Send a guard to investigate a noise at (x, y) — a coin clink or a panel.
export function guardInvestigate(guard, x, y) {
  if (guard.state === 'chase') return;
  guard.state = 'investigate';
  guard.stateTime = 0;
  guard.investigateX = clamp(x, TILE, 24 * TILE - TILE);
  guard.investigateY = clamp(y, TILE, 15 * TILE - TILE);
}

export function guardRadius() {
  return GUARD_RADIUS;
}
