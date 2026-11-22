// cameras.js — sweeping security cameras and their control panels.
import { TILE, CAMERA_RANGE, CAMERA_HALF_ANGLE, angleDiff, dist } from './config.js';
import { tileCenter, hasLineOfSight } from './world.js';

export function makeCamera(def, index) {
  const pos = tileCenter(def.tile[0], def.tile[1]);
  return {
    index,
    x: pos.x,
    y: pos.y,
    facing: def.facing, // centre of the sweep
    sweep: def.sweep, // radians of swing either side of facing
    speed: def.speed, // sweep speed
    phase: index * 1.7, // cameras start out of phase with each other
    angle: def.facing,
    disabled: false,
    seesPlayer: false,
  };
}

export function updateCamera(camera, world, dt, time, px, py) {
  if (camera.disabled) {
    camera.seesPlayer = false;
    return;
  }
  camera.angle = camera.facing + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
  camera.seesPlayer = cameraSeesPlayer(camera, world, px, py);
}

export function cameraSeesPlayer(camera, world, px, py) {
  if (camera.disabled) return false;
  const d = dist(camera.x, camera.y, px, py);
  if (d > CAMERA_RANGE) return false;
  const ang = Math.atan2(py - camera.y, px - camera.x);
  if (angleDiff(ang, camera.angle) > CAMERA_HALF_ANGLE) return false;
  return hasLineOfSight(world, camera.x, camera.y, px, py);
}
