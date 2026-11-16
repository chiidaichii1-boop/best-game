// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// garden is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Everything is canvas shapes and text — no images, no fonts to load — in one
// twilight palette: deep indigo night, teal garden, warm amber lantern light, violet wisps.

import { DAWN_SECONDS, FIELD, FONT, ORB, PALETTE, WISPS, waveOf } from './config.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVELUP = 'levelup';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** The level-up cards' layout, shared by the painter and the click test. */
const CARDS = { width: 300, height: 210, gap: 24, top: 252 };
const PANEL = { width: 640, top: 120, line: 32, bottom: 76 };

function cardX(index) {
  const total = 3 * CARDS.width + 2 * CARDS.gap;
  return (FIELD.width - total) / 2 + index * (CARDS.width + CARDS.gap);
}

/** Which level-up card, if any, holds the field point (x, y); -1 for none. */
export function cardAt(x, y) {
  if (y < CARDS.top || y > CARDS.top + CARDS.height) return -1;
  for (let index = 0; index < 3; index += 1) {
    if (x >= cardX(index) && x <= cardX(index) + CARDS.width) return index;
  }
  return -1;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();
  const decor = createRandom(20261116);
  const bushes = [];
  const flowers = [];
  const fireflies = [];
  for (let index = 0; index < 9; index += 1) {
    bushes.push({ x: decor.range(60, FIELD.width - 60), y: decor.range(70, FIELD.height - 70), r: decor.range(46, 92) });
  }
  for (let index = 0; index < 26; index += 1) {
    flowers.push({ x: decor.range(30, FIELD.width - 30), y: decor.range(40, FIELD.height - 30), color: decor.pick([PALETTE.flower, PALETTE.flowerPink, '#c9a7ff']) });
  }
  for (let index = 0; index < 22; index += 1) {
    fireflies.push({ x: decor.range(0, FIELD.width), y: decor.range(0, FIELD.height), phase: decor.range(0, Math.PI * 2), speed: decor.range(0.3, 0.9) });
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.textBaseline = baseline ?? 'alphabetic';
    context.fillText(value, x, y);
  }

  function circle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function glow(x, y, radius, color, alpha) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  function drawGarden(time) {
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // A soft moon glow, top right.
    glow(FIELD.width - 150, 90, 180, '#cdd8ff', 0.16);
    circle(FIELD.width - 150, 90, 34, '#e8eeff');
    circle(FIELD.width - 162, 82, 8, '#c3cfee');
    circle(FIELD.width - 138, 100, 6, '#c3cfee');
    for (const bush of bushes) {
      circle(bush.x, bush.y, bush.r, PALETTE.bush);
      circle(bush.x - bush.r * 0.3, bush.y - bush.r * 0.25, bush.r * 0.55, PALETTE.bushLight);
    }
    for (const flower of flowers) {
      circle(flower.x, flower.y, 4, flower.color);
      circle(flower.x, flower.y, 1.8, '#fff3d6');
    }
    // Fireflies drift slowly, each on its own slow loop.
    for (const fly of fireflies) {
      const x = fly.x + Math.sin(time * fly.speed + fly.phase) * 26;
      const y = fly.y + Math.cos(time * fly.speed * 0.8 + fly.phase) * 16;
      const twinkle = 0.35 + 0.3 * Math.sin(time * 2 + fly.phase * 3);
      glow(x, y, 9, '#ffe9a8', twinkle);
      circle(x, y, 2, '#ffedb0');
    }
  }

  function drawShards(state, time) {
    for (const shard of state.shards) {
      const bob = Math.sin(shard.bob) * 3;
      glow(shard.x, shard.y + bob, 12, '#ffb84d', 0.5);
      context.save();
      context.translate(shard.x, shard.y + bob);
      context.rotate(Math.PI / 4);
      context.fillStyle = PALETTE.amberBright;
      context.fillRect(-5, -5, 10, 10);
      context.restore();
    }
  }

  function drawWisp(wisp, time) {
    const def = WISPS[wisp.kind];
    const wobble = Math.sin(time * 3 + wisp.wobble) * 3;
    const x = wisp.x + wobble;
    const y = wisp.y + Math.cos(time * 2.4 + wisp.wobble) * 2;
    // A fading tail behind the direction of travel.
    context.strokeStyle = def.color;
    context.globalAlpha = 0.45;
    context.lineWidth = wisp.radius * 0.7;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x - wisp.vx * 0.09, y - wisp.vy * 0.09);
    context.lineTo(x, y);
    context.stroke();
    context.globalAlpha = 1;
    glow(x, y, wisp.radius * 2.6, def.color, 0.5);
    circle(x, y, wisp.radius, wisp.flash > 0 ? '#ffffff' : def.color);
    circle(x - wisp.radius * 0.32, y - wisp.radius * 0.2, wisp.radius * 0.16, '#ffffff');
    circle(x + wisp.radius * 0.32, y - wisp.radius * 0.2, wisp.radius * 0.16, '#ffffff');
    circle(x - wisp.radius * 0.32, y - wisp.radius * 0.2, wisp.radius * 0.07, '#1a1030');
    circle(x + wisp.radius * 0.32, y - wisp.radius * 0.2, wisp.radius * 0.07, '#1a1030');
    if (wisp.kind === 'brute') {
      context.strokeStyle = def.core;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, wisp.radius + 5, 0, Math.PI * 2);
      context.stroke();
    }
    if (wisp.kind === 'splitter') {
      context.strokeStyle = def.core;
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.arc(x, y, wisp.radius + 5, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    if (wisp.hp < wisp.maxHp) {
      const width = wisp.radius * 2;
      context.fillStyle = '#2a1a3a';
      context.fillRect(x - wisp.radius, y - wisp.radius - 10, width, 4);
      context.fillStyle = '#c9a7ff';
      context.fillRect(x - wisp.radius, y - wisp.radius - 10, width * (wisp.hp / wisp.maxHp), 4);
    }
  }

  function drawPlayer(state, time) {
    const player = state.player;
    // The lantern's aura: warm light that falls off with distance, gently pulsing.
    const pulse = 1 + Math.sin(time * 2.2) * 0.03;
    const auraRadius = player.auraRadius * pulse;
    const gradient = context.createRadialGradient(player.x, player.y, 10, player.x, player.y, auraRadius);
    gradient.addColorStop(0, 'rgba(255, 190, 90, 0.20)');
    gradient.addColorStop(0.75, 'rgba(255, 170, 70, 0.07)');
    gradient.addColorStop(1, 'rgba(255, 170, 70, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(255, 200, 110, 0.35)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
    context.stroke();
    // Orbiting ember orbs.
    for (const orb of state.orbPositions) {
      glow(orb.x, orb.y, 18, '#ffb84d', 0.8);
      circle(orb.x, orb.y, ORB.radius, '#ffd98a');
      circle(orb.x, orb.y, 4, '#fff6d8');
    }
    // The keeper: a small robed figure, blinking while untouchable after a hit.
    const blink = player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0;
    if (!blink) {
      glow(player.x, player.y, 46, '#ffcf6e', 0.55);
      // Cloak.
      context.fillStyle = '#2f6b5e';
      context.beginPath();
      context.moveTo(player.x, player.y - 16);
      context.quadraticCurveTo(player.x + 14, player.y - 2, player.x + 11, player.y + 14);
      context.quadraticCurveTo(player.x, player.y + 18, player.x - 11, player.y + 14);
      context.quadraticCurveTo(player.x - 14, player.y - 2, player.x, player.y - 16);
      context.fill();
      // Hood and face.
      circle(player.x, player.y - 8, 8, '#1e4a3f');
      circle(player.x - 3, player.y - 9, 1.6, '#ffe9b0');
      circle(player.x + 3, player.y - 9, 1.6, '#ffe9b0');
      // The lantern, held out toward where the keeper faces.
      const lx = player.x + Math.cos(player.face) * 20;
      const ly = player.y + Math.sin(player.face) * 20 + 4;
      context.fillStyle = '#3a2c14';
      context.fillRect(lx - 5, ly - 8, 10, 14);
      context.fillStyle = '#ffe9a8';
      context.fillRect(lx - 3, ly - 5, 6, 9);
    }
  }

  function drawBolts(state) {
    for (const bolt of state.bolts) {
      const angle = Math.atan2(bolt.vy, bolt.vx);
      context.strokeStyle = '#ffe9a8';
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(bolt.x - Math.cos(angle) * 18, bolt.y - Math.sin(angle) * 18);
      context.lineTo(bolt.x, bolt.y);
      context.stroke();
      glow(bolt.x, bolt.y, 12, '#ffd98a', 0.7);
    }
  }

  function drawParticles(state) {
    for (const spark of state.particles.sparks) {
      context.globalAlpha = 1 - spark.age / spark.life;
      circle(spark.x, spark.y, spark.size, spark.color);
    }
    context.globalAlpha = 1;
    for (const word of state.particles.words) {
      context.globalAlpha = 1 - word.age / word.life;
      text(word.text, word.x, word.y, 15, word.color, 'center');
    }
    context.globalAlpha = 1;
  }

  function bar(x, y, width, height, fraction, fill, back) {
    context.fillStyle = back;
    context.fillRect(x, y, width, height);
    context.fillStyle = fill;
    context.fillRect(x, y, width * Math.max(0, Math.min(1, fraction)), height);
    context.strokeStyle = 'rgba(255,255,255,0.25)';
    context.lineWidth = 1;
    context.strokeRect(x + 0.5, y + 0.5, width, height);
  }

  function drawHud(state) {
    const player = state.player;
    const timeLeft = DAWN_SECONDS - state.elapsed;
    // Health, top left.
    text('Health', 24, 16, 15, PALETTE.muted, 'left', 'top');
    bar(24, 36, 260, 18, player.hp / player.maxHp, PALETTE.hp, PALETTE.hpBack);
    text(`${Math.ceil(player.hp)} / ${player.maxHp}`, 292, 36, 16, PALETTE.text, 'left', 'top');
    text(`Level ${player.level}`, 24, 62, 17, PALETTE.xp, 'left', 'top');
    // XP bar, top centre.
    const xpWidth = 420;
    const xpX = (FIELD.width - xpWidth) / 2;
    text('Embers', xpX, 16, 15, PALETTE.muted, 'left', 'top');
    bar(xpX, 36, xpWidth, 12, player.xp / player.xpNeeded, PALETTE.xp, PALETTE.xpBack);
    // Dawn timer, centre, below the XP bar.
    text(`Dawn in ${formatTime(timeLeft)}`, FIELD.width / 2, 58, 24, timeLeft < 30 ? PALETTE.amberBright : PALETTE.text, 'center', 'top');
    // Score and wave, top right.
    text(`Banished ${state.banished}`, FIELD.width - 24, 16, 17, PALETTE.text, 'right', 'top');
    text(`Wave ${waveOf(state.elapsed)}`, FIELD.width - 24, 40, 17, PALETTE.muted, 'right', 'top');
    text(`Score ${state.score}`, FIELD.width - 24, 64, 17, PALETTE.amberBright, 'right', 'top');
    // Controls, bottom left, small and quiet.
    text('WASD / arrows move · Click or Space fires a bolt · P pause · M mute', 24, FIELD.height - 28, 15, PALETTE.muted, 'left', 'top');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(10, 14, 30, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x + 1, y + 1, PANEL.width - 2, height - 2);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.amber, 'center');
  }

  function drawUpgradeGlyph(id, x, y) {
    context.strokeStyle = PALETTE.amberBright;
    context.fillStyle = PALETTE.amberBright;
    context.lineWidth = 3;
    context.lineCap = 'round';
    if (id === 'orb') {
      circle(x, y, 10, PALETTE.amberBright);
      circle(x, y, 4, '#fff6d8');
    } else if (id === 'glow') {
      context.beginPath();
      context.arc(x, y, 13, 0, Math.PI * 2);
      context.stroke();
      circle(x, y, 5, PALETTE.amberBright);
    } else if (id === 'hot') {
      context.beginPath();
      context.moveTo(x, y - 13);
      context.quadraticCurveTo(x + 11, y + 2, x + 6, y + 10);
      context.quadraticCurveTo(x, y + 14, x - 6, y + 10);
      context.quadraticCurveTo(x - 11, y + 2, x, y - 13);
      context.fill();
    } else if (id === 'bolt') {
      context.beginPath();
      context.moveTo(x + 4, y - 14);
      context.lineTo(x - 6, y + 2);
      context.lineTo(x, y + 2);
      context.lineTo(x - 4, y + 14);
      context.lineTo(x + 6, y - 2);
      context.lineTo(x, y - 2);
      context.closePath();
      context.fill();
    } else if (id === 'pierce') {
      context.beginPath();
      context.moveTo(x - 12, y - 8);
      context.lineTo(x + 12, y + 8);
      context.moveTo(x - 12, y + 8);
      context.lineTo(x + 12, y - 8);
      context.stroke();
    } else if (id === 'boots') {
      context.beginPath();
      context.moveTo(x - 10, y + 8);
      context.lineTo(x, y - 8);
      context.lineTo(x + 10, y + 8);
      context.stroke();
    } else if (id === 'magnet') {
      context.beginPath();
      context.arc(x, y - 2, 11, Math.PI, 0);
      context.stroke();
      context.beginPath();
      context.moveTo(x - 11, y - 2);
      context.lineTo(x - 11, y + 10);
      context.moveTo(x + 11, y - 2);
      context.lineTo(x + 11, y + 10);
      context.stroke();
    } else if (id === 'sturdy') {
      context.beginPath();
      context.moveTo(x, y - 13);
      context.lineTo(x + 11, y - 7);
      context.lineTo(x + 11, y + 4);
      context.quadraticCurveTo(x + 11, y + 12, x, y + 15);
      context.quadraticCurveTo(x - 11, y + 12, x - 11, y + 4);
      context.lineTo(x - 11, y - 7);
      context.closePath();
      context.stroke();
    } else if (id === 'rich') {
      context.save();
      context.translate(x, y);
      context.rotate(Math.PI / 4);
      context.fillRect(-8, -8, 16, 16);
      context.restore();
    } else if (id === 'hands') {
      circle(x - 7, y, 6, PALETTE.amberBright);
      circle(x + 7, y, 6, PALETTE.amberBright);
    } else {
      // Meal: a heart.
      context.beginPath();
      context.moveTo(x, y + 10);
      context.quadraticCurveTo(x - 14, y - 2, x - 7, y - 10);
      context.quadraticCurveTo(x, y - 5, x, y - 2);
      context.quadraticCurveTo(x, y - 5, x + 7, y - 10);
      context.quadraticCurveTo(x + 14, y - 2, x, y + 10);
      context.fill();
    }
  }

  function drawLevelUp(state) {
    const choices = state.levelUpChoices;
    context.fillStyle = 'rgba(10, 14, 30, 0.66)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('Level up!', FIELD.width / 2, 150, 52, PALETTE.amberBright, 'center');
    text(`You reached level ${state.player.level} — choose one blessing for your lantern`, FIELD.width / 2, 196, 22, PALETTE.text, 'center');
    for (let index = 0; index < 3; index += 1) {
      const choice = choices[index];
      const x = cardX(index);
      const y = CARDS.top;
      context.fillStyle = PALETTE.panel;
      context.fillRect(x, y, CARDS.width, CARDS.height);
      context.strokeStyle = PALETTE.panelEdge;
      context.lineWidth = 2;
      context.strokeRect(x + 1, y + 1, CARDS.width - 2, CARDS.height - 2);
      drawUpgradeGlyph(choice.id, x + CARDS.width / 2, y + 52);
      text(choice.name, x + CARDS.width / 2, y + 104, 24, PALETTE.text, 'center');
      // Word-wrap the description into the card.
      const words = choice.desc.split(' ');
      const lines = [''];
      for (const word of words) {
        const trial = lines[lines.length - 1] === '' ? word : `${lines[lines.length - 1]} ${word}`;
        if (trial.length > 24 && lines[lines.length - 1] !== '') lines.push(word);
        else lines[lines.length - 1] = trial;
      }
      for (let line = 0; line < lines.length; line += 1) {
        text(lines[line], x + CARDS.width / 2, y + 140 + line * 26, 18, PALETTE.muted, 'center');
      }
      text(`Press ${index + 1} or click`, x + CARDS.width / 2, y + CARDS.height - 26, 17, PALETTE.amber, 'center');
    }
  }

  function drawTitleDecor(time) {
    // A few wisps drift across the title's garden so the first screen already moves.
    const decorRandom = createRandom(7);
    for (let index = 0; index < 7; index += 1) {
      const kind = decorRandom.pick(['drifter', 'darter', 'splitter']);
      const def = WISPS[kind];
      const cx = decorRandom.range(120, FIELD.width - 120);
      const cy = decorRandom.range(120, FIELD.height - 120);
      const x = cx + Math.sin(time * 0.5 + index * 1.7) * 60;
      const y = cy + Math.cos(time * 0.4 + index * 2.3) * 40;
      glow(x, y, def.radius * 2.6, def.color, 0.5);
      circle(x, y, def.radius, def.color);
      circle(x - def.radius * 0.32, y - def.radius * 0.2, def.radius * 0.16, '#ffffff');
      circle(x + def.radius * 0.32, y - def.radius * 0.2, def.radius * 0.16, '#ffffff');
    }
  }

  /** Paint one frame: the garden, the things in it, then the HUD or a panel for the screen. */
  function draw(state, screen, best, time) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y + shakeY * view.scale);
    drawGarden(time);
    if (screen === SCREEN_TITLE) {
      drawTitleDecor(time);
      drawPanel(
        'LANTERNKEEP',
        [
          'You are the keeper of the last lantern in a twilight garden.',
          'Shadow wisps swarm in from the dark. Your light banishes them.',
          'Gather embers, grow stronger, and survive until dawn — 5 minutes.',
          'Move with WASD or arrows. Click or Space fires a bolt at your cursor.',
          '',
          `Best score ${best}`,
        ],
        'Press Space or click to start',
      );
      return;
    }
    drawShards(state, time);
    for (const wisp of state.swarm.list) drawWisp(wisp, time);
    drawPlayer(state, time);
    drawBolts(state);
    drawParticles(state);
    drawHud(state);
    if (screen === SCREEN_LEVELUP) {
      drawLevelUp(state);
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The wisps will wait for you.'], 'Press P to resume');
    } else if (screen === SCREEN_WIN) {
      drawPanel(
        'Dawn Breaks',
        [
          'The sun rises over the garden. You kept the light alive.',
          `Score ${state.score}   ·   Banished ${state.banished} wisps`,
          `Reached level ${state.player.level}   ·   Best ${best}`,
        ],
        'Press Space or click to play again',
      );
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'The Light Goes Out',
        [
          'The wisps close in and the lantern fades.',
          `Score ${state.score}   ·   Banished ${state.banished} wisps`,
          `Reached level ${state.player.level}   ·   Best ${best}`,
        ],
        'Press Space or click to try again',
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
