// The screenshot scenes behind ?shot=start|play|levelup|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot (flee the nearest wisp when it gets close, chase the nearest ember shard,
// keep the bolt firing at the closest wisp, take a level-up choice when one opens), so
// the frame is what a real game looks like and the same seed always gives the same frame.

import { DAWN_SECONDS, FIELD, STEP } from './config.js';
import { EVENT_LEVELUP, EVENT_OVER, EVENT_WIN } from './world.js';
import { rollUpgrades } from './upgrades.js';
import { SCREEN_LEVELUP, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const PLAY_SECONDS = 150;
const MAX_ATTEMPTS = 3;

function nearestWisp(state) {
  let best = null;
  let bestDist = Infinity;
  for (const wisp of state.swarm.list) {
    const dist = Math.hypot(wisp.x - state.player.x, wisp.y - state.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = wisp;
    }
  }
  return { wisp: best, dist: bestDist };
}

function nearestShard(state) {
  let best = null;
  let bestDist = Infinity;
  for (const shard of state.shards) {
    const dist = Math.hypot(shard.x - state.player.x, shard.y - state.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = shard;
    }
  }
  return { shard: best, dist: bestDist };
}

/** A fake input the autopilot steers: direction, a mouse that aims at the nearest wisp. */
function autopilotInput(world, random) {
  const state = world.state;
  const mouse = { x: state.player.x, y: state.player.y - 100, down: true, clicked: false };
  return {
    mouse,
    direction() {
      const near = nearestWisp(state);
      let tx = FIELD.width / 2;
      let ty = FIELD.height / 2;
      if (near.wisp !== null && near.dist < 150) {
        // Flee: run away from the closest wisp.
        const dx = state.player.x - near.wisp.x;
        const dy = state.player.y - near.wisp.y;
        const dist = Math.hypot(dx, dy) || 1;
        tx = state.player.x + (dx / dist) * 200;
        ty = state.player.y + (dy / dist) * 200;
      } else {
        const shard = nearestShard(state);
        if (shard.shard !== null) {
          tx = shard.shard.x;
          ty = shard.shard.y;
        }
      }
      const dx = tx - state.player.x;
      const dy = ty - state.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return { x: 0, y: 0 };
      return { x: dx / dist, y: dy / dist };
    },
    takeClick() {
      return false;
    },
  };
}

/** Play the world forward for `seconds` with the autopilot; returns the events seen. */
function playForward(world, random, seconds, audio) {
  const input = autopilotInput(world, random);
  const steps = Math.floor(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    const near = nearestWisp(world.state);
    if (near.wisp !== null) {
      input.mouse.x = near.wisp.x;
      input.mouse.y = near.wisp.y;
    }
    const events = world.step(STEP, input, audio);
    if (events & EVENT_LEVELUP) {
      world.chooseUpgrade(random.int(0, 2));
    }
    if (events & EVENT_OVER) return EVENT_OVER;
    if (events & EVENT_WIN) return EVENT_WIN;
  }
  return 0;
}

/** A silent audio stand-in: the staged scenes make no sound. */
const silentAudio = {
  pickup() {},
  banish() {},
  shoot() {},
  hurt() {},
  click() {},
  levelUp() {},
  win() {},
  lose() {},
};

/**
 * Set `world` to the named scene (start, play, levelup or end; any other name is start)
 * and return the screen to draw over it, the best score to show and a fixed clock time
 * for the ambient animation, so the same seed always gives the same frame.
 */
export function stageShot(name, world, random) {
  if (name !== 'play' && name !== 'levelup' && name !== 'end') {
    world.reset();
    return { screen: SCREEN_TITLE, best: 0, time: 3 };
  }
  // Play forward until the keeper is mid-game and alive; retry a few times if the
  // autopilot gets caught early, so the scene is a busy game, not an empty field.
  let outcome = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    world.reset();
    outcome = playForward(world, random, PLAY_SECONDS, silentAudio);
    if (!(outcome & EVENT_OVER)) break;
  }
  if (outcome & EVENT_OVER) {
    return { screen: SCREEN_OVER, best: world.state.score, time: 3 };
  }
  if (name === 'end') {
    // Stage the win: the night is over, dawn breaks, the run's real numbers stay.
    world.state.elapsed = DAWN_SECONDS;
    world.state.won = true;
    world.state.score = world.state.banished * 10 + DAWN_SECONDS;
    return { screen: SCREEN_WIN, best: world.state.score, time: 3 };
  }
  if (name === 'levelup') {
    world.state.levelUpChoices = rollUpgrades(random, world.state.player);
    return { screen: SCREEN_LEVELUP, best: world.state.score, time: 3 };
  }
  return { screen: SCREEN_PLAY, best: world.state.score, time: 3 };
}
