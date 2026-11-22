// render.js — canvas drawing for Midnight Vault: The Heist.
// Everything is drawn with canvas primitives; there are no image assets.
import {
  TILE,
  COLS,
  ROWS,
  HUD_H,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  ALARM_MAX,
  PANEL_RADIUS,
} from './config.js';
import { tileCenter, tileAt, isWall, isCover } from './world.js';
import { coinPosition, lootCollected } from './player.js';

const W = COLS * TILE;
const H = ROWS * TILE + HUD_H;

// Draw a vision cone wedge from (x, y) facing `angle`, in canvas space.
function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx, world, time) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const c = tileAt(world, tx, ty);
      const px = tx * TILE;
      const py = HUD_H + ty * TILE;
      const checker = (tx + ty) % 2 === 0;
      if (c === '~') {
        ctx.fillStyle = '#0a0d18';
      } else if (c === '*') {
        ctx.fillStyle = checker ? '#1a1a26' : '#171722';
      } else {
        ctx.fillStyle = checker ? '#141824' : '#11141f';
      }
      ctx.fillRect(px, py, TILE, TILE);
      if (c === '*') {
        // Warm spotlight pool on the floor.
        const g = ctx.createRadialGradient(
          px + TILE / 2, py + TILE / 2, 4,
          px + TILE / 2, py + TILE / 2, TILE * 0.85,
        );
        g.addColorStop(0, 'rgba(255, 214, 130, 0.20)');
        g.addColorStop(1, 'rgba(255, 214, 130, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(px, py, TILE, TILE);
      }
      if (c === '~') {
        ctx.fillStyle = 'rgba(90, 120, 255, 0.06)';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
  }
  void time;
}

function drawWallsAndCover(ctx, world) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const c = tileAt(world, tx, ty);
      const px = tx * TILE;
      const py = HUD_H + ty * TILE;
      if (c === '#') {
        ctx.fillStyle = '#2b3040';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#3a4156';
        ctx.fillRect(px, py, TILE, 4);
        ctx.fillStyle = '#1c2029';
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
      } else if (c === 'C') {
        // Wooden crate with cross planks.
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#4a3018';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 3);
        ctx.lineTo(px + TILE - 3, py + TILE - 3);
        ctx.moveTo(px + TILE - 3, py + 3);
        ctx.lineTo(px + 3, py + TILE - 3);
        ctx.stroke();
        ctx.fillStyle = '#8a6238';
        ctx.fillRect(px + 3, py + 3, TILE - 6, 5);
      }
    }
  }
}

function drawLoot(ctx, world, time) {
  world.loot.forEach((item, i) => {
    if (item.taken) return;
    const pos = tileCenter(item.tx, item.ty);
    const py = HUD_H + pos.y;
    const bob = Math.sin(time * 2 + i * 1.9) * 2;
    const glint = 0.6 + 0.4 * Math.sin(time * 3 + i * 2.4);
    ctx.save();
    ctx.translate(pos.x, py + bob);
    if (i % 3 === 0) {
      // Gold bar.
      ctx.fillStyle = '#f7c948';
      ctx.fillRect(-11, -6, 22, 12);
      ctx.fillStyle = `rgba(255, 255, 220, ${0.5 * glint})`;
      ctx.fillRect(-11, -6, 22, 4);
      ctx.strokeStyle = '#a67c00';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-11, -6, 22, 12);
    } else if (i % 3 === 1) {
      // Gem.
      ctx.fillStyle = '#59d6ff';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * glint})`;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(5, -3);
      ctx.lineTo(-5, -3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Cash stack.
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(-11, -7, 22, 14);
      ctx.fillStyle = '#e8f5e9';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-11, -7, 22, 14);
    }
    ctx.restore();
  });
}

function drawExit(ctx, world, unlocked, time) {
  const pos = tileCenter(world.exit.tx, world.exit.ty);
  const py = HUD_H + pos.y;
  ctx.save();
  ctx.translate(pos.x, py);
  if (unlocked) {
    // Getaway van, ready to go, with a pulsing green glow.
    const pulse = 0.25 + 0.12 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(80, 255, 140, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f7a4d';
    ctx.fillRect(-16, -9, 32, 18);
    ctx.fillStyle = '#c8f7dc';
    ctx.fillRect(6, -6, 8, 12);
    ctx.fillStyle = '#123524';
    ctx.beginPath();
    ctx.arc(-8, 10, 4, 0, Math.PI * 2);
    ctx.arc(8, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eafff1';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY', 0, -14);
  } else {
    // Locked: a steel door with a padlock.
    ctx.fillStyle = '#3c4457';
    ctx.fillRect(-14, -14, 28, 28);
    ctx.strokeStyle = '#232839';
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -14, 28, 28);
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2, 2, 4, 8);
    ctx.fillStyle = '#9aa3b5';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', 0, -18);
  }
  ctx.restore();
}

function drawPanels(ctx, world, player, panelProgress) {
  for (const panel of world.panels) {
    const pos = tileCenter(panel.tx, panel.ty);
    const py = HUD_H + pos.y;
    ctx.save();
    ctx.translate(pos.x, py);
    ctx.fillStyle = '#22303f';
    ctx.fillRect(-8, -11, 16, 22);
    ctx.strokeStyle = '#4d6b85';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -11, 16, 22);
    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ee2a8';
    ctx.fillRect(-5, 3, 10, 2);
    ctx.fillRect(-5, 7, 7, 2);
    if (panelProgress > 0) {
      ctx.fillStyle = '#7ee2a8';
      ctx.fillRect(-10, -16, 20 * panelProgress, 3);
    }
    ctx.restore();
  }
  void player;
}

function drawPlayer(ctx, player) {
  const py = HUD_H + player.y;
  ctx.save();
  ctx.translate(player.x, py);
  // Lantern glow.
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
  g.addColorStop(0, 'rgba(255, 210, 120, 0.35)');
  g.addColorStop(1, 'rgba(255, 210, 120, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, pale face, hood point toward facing.
  ctx.rotate(player.facing);
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e3442';
  ctx.beginPath();
  ctx.moveTo(player.radius, 0);
  ctx.lineTo(player.radius + 7, -5);
  ctx.lineTo(player.radius + 7, 5);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(-player.facing);
  ctx.fillStyle = '#f2d5b8';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 5, Math.sin(player.facing) * 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    const py = HUD_H + guard.y;
    // Vision cone under the guard.
    let coneColor = 'rgba(255, 200, 60, 0.16)';
    if (guard.state === 'suspicious') coneColor = 'rgba(255, 140, 40, 0.22)';
    if (guard.state === 'chase' || guard.state === 'investigate') coneColor = 'rgba(255, 70, 60, 0.22)';
    drawCone(ctx, guard.x, py, guard.angle, CONE_RANGE, CONE_HALF_ANGLE, coneColor);
    // Uniformed guard with a pale face.
    ctx.save();
    ctx.translate(guard.x, py);
    ctx.fillStyle = '#1d2b45';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a5a78';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f2d5b8';
    ctx.beginPath();
    ctx.arc(Math.cos(guard.angle) * 5, Math.sin(guard.angle) * 5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Cap brim.
    ctx.fillStyle = '#101826';
    ctx.fillRect(-6, -16, 12, 4);
    ctx.restore();
    // State indicator.
    if (guard.state === 'suspicious') {
      ctx.fillStyle = '#ffb020';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, py - 22);
    } else if (guard.state === 'chase') {
      ctx.fillStyle = '#ff463c';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, py - 22);
    } else if (guard.state === 'investigate') {
      ctx.fillStyle = '#ffd23c';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, py - 22);
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const py = HUD_H + cam.y;
    if (!cam.disabled) {
      drawCone(ctx, cam.x, py, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, 'rgba(255, 60, 60, 0.13)');
    }
    ctx.save();
    ctx.translate(cam.x, py);
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.disabled ? '#3a3f4a' : '#22262f';
    ctx.fillRect(-6, -5, 14, 10);
    ctx.fillStyle = cam.disabled ? '#555c66' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(9, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (cam.disabled) {
      ctx.fillStyle = '#7ee2a8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', cam.x, py - 14);
    }
  }
}

function drawCoin(ctx, player) {
  const c = coinPosition(player);
  if (!c) return;
  const py = HUD_H + c.y - c.height;
  ctx.save();
  ctx.translate(c.x, py);
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a67c00';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#a67c00';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', 0, 3);
  ctx.restore();
  if (c.height === 0) {
    // A faint ring where the coin lies, so the player can find it.
    ctx.strokeStyle = 'rgba(247, 201, 72, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, HUD_H + c.y, 11, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, view) {
  ctx.fillStyle = '#0b0e16';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = '#1e2433';
  ctx.fillRect(0, HUD_H - 2, W, 2);

  // Alarm meter.
  const barX = 16;
  const barY = 22;
  const barW = 260;
  const barH = 20;
  ctx.fillStyle = '#1c2230';
  ctx.fillRect(barX, barY, barW, barH);
  const frac = view.alarm / ALARM_MAX;
  const alarmColor = view.alarmed ? '#ff3b30' : frac > 0.6 ? '#ff9f1c' : frac > 0.3 ? '#ffd23c' : '#4caf50';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(barX, barY, barW * frac, barH);
  ctx.strokeStyle = '#3a4156';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = view.alarmed ? '#ff6b60' : '#c7cede';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(view.alarmed ? 'ALARM!' : 'ALARM', barX, barY - 6);

  // Loot, coins, lives.
  ctx.fillStyle = '#f7c948';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◆ ${lootCollected(view.world)}/3`, 300, 38);
  ctx.fillStyle = '#e8ecf5';
  ctx.fillText(`◉ ${view.coins}`, 380, 38);
  ctx.fillStyle = '#ff5a6e';
  ctx.fillText('♥'.repeat(Math.max(0, view.lives)), 450, 38);

  // Level name and timer, right aligned.
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(view.levelName, W - 16, 26);
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '13px sans-serif';
  const mins = Math.floor(view.levelTime / 60);
  const secs = Math.floor(view.levelTime % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}  ·  par ${view.par}s`, W - 16, 46);

  // Mute hint.
  if (view.muted) {
    ctx.fillStyle = '#9aa3b5';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MUTED (M)', 560, 38);
  }
}

function overlay(ctx, title, lines, accent, alpha = 0.82) {
  ctx.fillStyle = `rgba(5, 7, 12, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, H / 2 - 70);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, H / 2 - 20 + i * 28);
  });
}

// view: { world, player, guards, cameras, alarm, alarmed, coins, lives,
//   levelName, levelTime, par, muted, state, time, totalTime, score,
//   panelProgress, levelIndex }
export function render(ctx, view) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0e16';
  ctx.fillRect(0, 0, W, H);

  const world = view.world;
  const unlocked = lootCollected(world) === 3;
  drawFloor(ctx, world, view.time);
  drawGuards(ctx, view.guards);
  drawCameras(ctx, view.cameras);
  drawLoot(ctx, world, view.time);
  drawExit(ctx, world, unlocked, view.time);
  drawPanels(ctx, world, view.player, view.panelProgress);
  drawWallsAndCover(ctx, world);
  drawCoin(ctx, view.player);
  drawPlayer(ctx, view.player);
  drawHud(ctx, view);

  if (view.state === 'title') {
    overlay(ctx, 'MIDNIGHT VAULT', [
      'THE HEIST  ·  a top-down stealth game',
      '',
      'WASD / arrows to move  ·  Shift to sneak  ·  Click to toss a coin',
      'E (hold) by a panel to disable the cameras  ·  P pause  ·  M mute',
      'Grab all 3 loot, then reach the getaway van. Stay out of the cones.',
      '',
      'Press Enter or click to begin',
    ], '#f7c948', 0.62);
  } else if (view.state === 'paused') {
    overlay(ctx, 'PAUSED', ['Press P or Esc to keep stealing'], '#9aa3b5');
  } else if (view.state === 'levelcomplete') {
    overlay(ctx, 'LEVEL CLEAR', [
      `${view.levelName} cleared in ${Math.floor(view.levelTime)}s (par ${view.par}s)`,
      `Score this level: ${view.levelScore}`,
      '',
      'Press Enter for the next level',
    ], '#7ee2a8');
  } else if (view.state === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      'A guard grabbed you while the alarm was sounding.',
      view.lives > 0 ? `${view.lives} ${view.lives === 1 ? 'life' : 'lives'} left. The level restarts.` : 'No lives left.',
    ], '#ff5a6e');
  } else if (view.state === 'gameover') {
    overlay(ctx, 'GAME OVER', [
      'The crew got pinched. The vault keeps its gold tonight.',
      '',
      'Press Enter to try the heist again',
    ], '#ff5a6e');
  } else if (view.state === 'victory') {
    const mins = Math.floor(view.totalTime / 60);
    const secs = Math.floor(view.totalTime % 60);
    overlay(ctx, 'THE PERFECT HEIST', [
      'All three levels cleared. The vault is empty and the van is gone.',
      `Total time: ${mins}:${String(secs).padStart(2, '0')}  ·  Total score: ${view.score}`,
      '',
      'Press Enter to run it back',
    ], '#f7c948');
  }
}

export function canvasSize() {
  return { width: W, height: H };
}
