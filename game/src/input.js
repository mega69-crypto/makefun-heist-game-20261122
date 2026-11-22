// input.js — keyboard + mouse input for Midnight Vault: The Heist.
// Holds the live key state; the game polls it every frame. Edge-triggered
// actions (pause, mute, confirm, interact) are delivered as one-shot flags
// the game consumes each tick.

export function makeInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    interact: false, // E held down
    pausePressed: false, // P or Escape, one-shot
    mutePressed: false, // M, one-shot
    confirmPressed: false, // Enter or Space, one-shot
    click: null, // { x, y } in canvas pixels, one-shot
    anyKey: false,
  };

  const keyMap = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    KeyE: 'interact',
  };

  function onKeyDown(e) {
    input.anyKey = true;
    if (e.code === 'KeyP' || e.code === 'Escape') {
      input.pausePressed = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyM') {
      input.mutePressed = true;
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      input.confirmPressed = true;
      e.preventDefault();
      return;
    }
    const field = keyMap[e.code];
    if (field) {
      input[field] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const field = keyMap[e.code];
    if (field) input[field] = false;
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    input.anyKey = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  // Call once per frame after the game has read the one-shot flags.
  input.consumeOneShots = function () {
    input.pausePressed = false;
    input.mutePressed = false;
    input.confirmPressed = false;
    input.click = null;
    input.anyKey = false;
  };

  return input;
}
