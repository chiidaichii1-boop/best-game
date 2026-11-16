// Keyboard and pointer input for a top-down game. Held keys give a steering vector;
// one-shot presses (start, pause, mute, upgrade picks) are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost or counted twice.
// The mouse reports its position in field coordinates and whether its button is held,
// so the lantern bolt can be aimed at the cursor.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_UPGRADE_1 = 8;
export const ACTION_UPGRADE_2 = 16;
export const ACTION_UPGRADE_3 = 32;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const PICK = new Map([
  ['Digit1', ACTION_UPGRADE_1],
  ['Digit2', ACTION_UPGRADE_2],
  ['Digit3', ACTION_UPGRADE_3],
  ['Numpad1', ACTION_UPGRADE_1],
  ['Numpad2', ACTION_UPGRADE_2],
  ['Numpad3', ACTION_UPGRADE_3],
]);

export function createInput(canvas) {
  const held = new Set();
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2, down: false, clicked: false };
  let actions = 0;

  function fieldPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const ox = (rect.width - FIELD.width * scale) / 2;
    const oy = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code)) {
      held.add(event.code);
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (PICK.has(event.code)) {
      if (!event.repeat) actions |= PICK.get(event.code);
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.clear();
    mouse.down = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const point = fieldPoint(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = fieldPoint(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.down = true;
    mouse.clicked = true;
    actions |= ACTION_CONFIRM;
  });
  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  return {
    /** A normalised {x, y} steering vector from the held movement keys. */
    direction() {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        if (LEFT.has(code)) dx -= 1;
        if (RIGHT.has(code)) dx += 1;
        if (UP.has(code)) dy -= 1;
        if (DOWN.has(code)) dy += 1;
      }
      if (dx === 0 && dy === 0) return { x: 0, y: 0 };
      const length = Math.hypot(dx, dy);
      return { x: dx / length, y: dy / length };
    },
    /** The mouse in field coordinates, and whether its button is held. */
    mouse,
    /** True once after a click, then cleared: the loop fires one bolt per click. */
    takeClick() {
      const clicked = mouse.clicked;
      mouse.clicked = false;
      return clicked;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
