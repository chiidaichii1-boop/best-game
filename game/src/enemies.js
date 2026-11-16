// The wisp swarm: five kinds with distinct looks and behaviour, spawned from the
// garden's edges in waves that grow as the night goes on. A wisp drifts toward the
// keeper (darters weave as they come), and when one is banished a splitter breaks
// into two minis. Nothing here draws or sounds; it only moves numbers.

import { FIELD, SPAWN, WISPS } from './config.js';

const KINDS = ['drifter', 'darter', 'splitter', 'brute'];

/** Which kinds may appear at this point in the night, with weights that favour the weak early. */
function kindWeights(elapsed) {
  const weights = [];
  for (const kind of KINDS) {
    if (elapsed < SPAWN.firstSeen[kind]) continue;
    if (kind === 'drifter') weights.push(['drifter', 10]);
    else if (kind === 'darter') weights.push(['darter', 6]);
    else if (kind === 'splitter') weights.push(['splitter', 4]);
    else weights.push(['brute', 3]);
  }
  return weights;
}

function pickKind(random, elapsed) {
  const weights = kindWeights(elapsed);
  let total = 0;
  for (const [, weight] of weights) total += weight;
  let roll = random.next() * total;
  for (const [kind, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return 'drifter';
}

function makeWisp(kind, x, y, random) {
  const def = WISPS[kind];
  const speed = def.speed * random.range(0.9, 1.1);
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: def.hp,
    maxHp: def.hp,
    radius: def.radius,
    speed,
    damage: def.damage,
    xp: def.xp,
    flash: 0,
    hitCooldown: 0,
    wobble: random.angle(),
    wobbleSpeed: random.range(2.2, 3.4),
  };
}

export function createSwarm(random) {
  const list = [];
  let timer = 1.2;

  function spawnEdge(elapsed) {
    const side = Math.floor(random.next() * 4);
    const margin = 30;
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = random.range(0, FIELD.width);
      y = -margin;
    } else if (side === 1) {
      x = FIELD.width + margin;
      y = random.range(0, FIELD.height);
    } else if (side === 2) {
      x = random.range(0, FIELD.width);
      y = FIELD.height + margin;
    } else {
      x = -margin;
      y = random.range(0, FIELD.height);
    }
    list.push(makeWisp(pickKind(random, elapsed), x, y, random));
  }

  function spawnInterval(elapsed) {
    const t = Math.min(1, elapsed / 300);
    return SPAWN.startInterval + (SPAWN.endInterval - SPAWN.startInterval) * t;
  }

  function batchSize(elapsed) {
    const t = Math.min(1, elapsed / 300);
    return Math.round(SPAWN.batchStart + (SPAWN.batchEnd - SPAWN.batchStart) * t);
  }

  return {
    list,
    reset() {
      list.length = 0;
      timer = 1.2;
    },
    /** How many wisps are alive right now. */
    get count() {
      return list.length;
    },
    update(dt, elapsed, player) {
      timer -= dt;
      if (timer <= 0 && list.length < SPAWN.maxAlive) {
        const batch = batchSize(elapsed);
        for (let index = 0; index < batch; index += 1) spawnEdge(elapsed);
        timer += spawnInterval(elapsed);
      }
      for (const wisp of list) {
        const dx = player.x - wisp.x;
        const dy = player.y - wisp.y;
        const dist = Math.hypot(dx, dy) || 1;
        let vx = (dx / dist) * wisp.speed;
        let vy = (dy / dist) * wisp.speed;
        if (wisp.kind === 'darter') {
          // Darters weave side to side as they close in.
          const perpendicular = Math.sin(wisp.wobble) * 0.7;
          vx += (-dy / dist) * perpendicular * wisp.speed;
          vy += (dx / dist) * perpendicular * wisp.speed;
          wisp.wobble += wisp.wobbleSpeed * dt;
        }
        wisp.vx = vx;
        wisp.vy = vy;
        wisp.x += vx * dt;
        wisp.y += vy * dt;
        if (wisp.flash > 0) wisp.flash = Math.max(0, wisp.flash - dt);
        if (wisp.hitCooldown > 0) wisp.hitCooldown = Math.max(0, wisp.hitCooldown - dt);
      }
    },
    /** Remove a wisp; a splitter leaves two minis behind. Returns the minis made. */
    banish(index, random) {
      const wisp = list[index];
      list.splice(index, 1);
      if (wisp.kind !== 'splitter') return [];
      const minis = [];
      for (let count = 0; count < 2; count += 1) {
        const mini = makeWisp('mini', wisp.x, wisp.y, random);
        mini.x += count === 0 ? -14 : 14;
        minis.push(mini);
      }
      list.push(...minis);
      return minis;
    },
  };
}
