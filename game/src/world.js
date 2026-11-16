// The game's rules and state, with no drawing and no browser in it: the keeper, the
// wisp swarm, bolts, ember shards, particles, the night's clock and the score. step()
// advances one fixed step and returns what happened as bit flags, so the caller can
// react (sounds, screens) without the world knowing about them. A level-up pauses the
// world: step() is simply not called while the choice is open.

import { BOLT, DAWN_SECONDS, FIELD, ORB, PLAYER, SHARD, WISPS } from './config.js';
import { applyUpgrade, createPlayer, gainXp, movePlayer, resetPlayer } from './player.js';
import { createSwarm } from './enemies.js';
import { rollUpgrades } from './upgrades.js';
import { createParticles } from './particles.js';

export const EVENT_HIT = 1;
export const EVENT_BANISH = 2;
export const EVENT_LEVELUP = 4;
export const EVENT_OVER = 8;
export const EVENT_WIN = 16;
export const EVENT_PICKUP = 32;

const AURA_TICK = 0.25;

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function createWorld(random) {
  const player = createPlayer();
  const swarm = createSwarm(random);
  const particles = createParticles();
  const bolts = [];
  const shards = [];
  const state = {
    player,
    swarm,
    particles,
    bolts,
    shards,
    elapsed: 0,
    banished: 0,
    score: 0,
    shake: 0,
    auraTick: 0,
    orbPositions: [],
    levelUpChoices: null,
    won: false,
    over: false,
  };

  function reset() {
    resetPlayer(player);
    swarm.reset();
    particles.reset();
    bolts.length = 0;
    shards.length = 0;
    state.elapsed = 0;
    state.banished = 0;
    state.score = 0;
    state.shake = 0;
    state.auraTick = 0;
    state.orbPositions = orbPositions();
    state.levelUpChoices = null;
    state.won = false;
    state.over = false;
  }

  function dropShards(x, y, value) {
    for (let count = 0; count < value; count += 1) {
      shards.push({
        x: x + random.range(-12, 12),
        y: y + random.range(-12, 12),
        vx: 0,
        vy: 0,
        value: 1,
        bob: random.range(0, Math.PI * 2),
      });
    }
  }

  /** Damage one wisp; returns true when it was banished. */
  function damageWisp(index, amount, audio, events) {
    const wisp = swarm.list[index];
    wisp.hp -= amount;
    wisp.flash = 0.12;
    if (wisp.hp > 0) return events;
    const def = WISPS[wisp.kind];
    particles.burst(wisp.x, wisp.y, def.color, 10, 170);
    particles.word(wisp.x, wisp.y - 10, `+${wisp.xp}`, '#ffd98a');
    audio.banish();
    state.banished += 1;
    dropShards(wisp.x, wisp.y, wisp.xp);
    swarm.banish(index, random);
    return events | EVENT_BANISH;
  }

  function fireBolt(target, audio) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    bolts.push({
      x: player.x + Math.cos(angle) * (player.radius + 6),
      y: player.y + Math.sin(angle) * (player.radius + 6),
      vx: Math.cos(angle) * BOLT.speed,
      vy: Math.sin(angle) * BOLT.speed,
      pierce: player.boltPierce,
      damage: player.boltDamage,
    });
    player.boltTimer = player.boltCooldown;
    audio.shoot();
  }

  function orbPositions() {
    const positions = [];
    for (let index = 0; index < player.orbCount; index += 1) {
      const angle = player.orbAngle + (index * Math.PI * 2) / player.orbCount;
      positions.push({
        x: player.x + Math.cos(angle) * ORB.orbitRadius,
        y: player.y + Math.sin(angle) * ORB.orbitRadius,
      });
    }
    return positions;
  }

  /**
   * One fixed step. `input` is the input module (direction, mouse, click); `audio` is
   * the sound module. Returns EVENT_* flags. Call it only while the game is playing.
   */
  function step(dt, input, audio) {
    let events = 0;
    if (state.won || state.over) {
      particles.update(dt);
      return events;
    }
    state.elapsed += dt;
    state.score = state.banished * 10 + Math.floor(state.elapsed);
    if (state.elapsed >= DAWN_SECONDS) {
      state.won = true;
      state.elapsed = DAWN_SECONDS;
      return EVENT_WIN;
    }

    movePlayer(player, input.direction(), dt);
    player.orbAngle += ORB.angularSpeed * player.orbSpeedMult * dt;
    state.orbPositions = orbPositions();
    swarm.update(dt, state.elapsed, player);

    // The lantern's aura burns every wisp standing in the light, four times a second.
    state.auraTick += dt;
    if (state.auraTick >= AURA_TICK) {
      state.auraTick -= AURA_TICK;
      const damage = player.auraDps * AURA_TICK;
      for (let index = swarm.list.length - 1; index >= 0; index -= 1) {
        const wisp = swarm.list[index];
        if (distance(wisp.x, wisp.y, player.x, player.y) <= player.auraRadius + wisp.radius) {
          events = damageWisp(index, damage, audio, events);
        }
      }
    }

    // Ember orbs burn wisps they touch, then need a moment before they can burn again.
    const orbs = orbPositions();
    const orbDamage = ORB.baseDamage * player.orbDamageMult;
    for (const orb of orbs) {
      for (let index = swarm.list.length - 1; index >= 0; index -= 1) {
        const wisp = swarm.list[index];
        if (wisp.hitCooldown > 0) continue;
        if (distance(wisp.x, wisp.y, orb.x, orb.y) <= ORB.radius + wisp.radius) {
          wisp.hitCooldown = ORB.hitCooldown;
          const dx = wisp.x - player.x;
          const dy = wisp.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          wisp.x += (dx / dist) * 10;
          wisp.y += (dy / dist) * 10;
          particles.word(wisp.x, wisp.y - 12, String(Math.round(orbDamage)), '#ffe9b0');
          events = damageWisp(index, orbDamage, audio, events);
        }
      }
    }

    // Fire a bolt on a click, or while the mouse button is held (at the bolt's cooldown).
    const clicked = input.takeClick();
    if ((clicked || input.mouse.down) && player.boltTimer <= 0) {
      fireBolt(input.mouse, audio);
    }

    // Bolts fly straight and burn through as many wisps as their pierce allows.
    for (let index = bolts.length - 1; index >= 0; index -= 1) {
      const bolt = bolts[index];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      let spent = false;
      if (bolt.x < -20 || bolt.x > FIELD.width + 20 || bolt.y < -20 || bolt.y > FIELD.height + 20) {
        bolts.splice(index, 1);
        continue;
      }
      for (let wispIndex = swarm.list.length - 1; wispIndex >= 0; wispIndex -= 1) {
        const wisp = swarm.list[wispIndex];
        if (distance(wisp.x, wisp.y, bolt.x, bolt.y) <= BOLT.radius + wisp.radius) {
          const dx = bolt.vx;
          const dy = bolt.vy;
          const dist = Math.hypot(dx, dy) || 1;
          wisp.x += (dx / dist) * 12;
          wisp.y += (dy / dist) * 12;
          particles.word(wisp.x, wisp.y - 12, String(Math.round(bolt.damage)), '#ffffff');
          events = damageWisp(wispIndex, bolt.damage, audio, events);
          bolt.pierce -= 1;
          if (bolt.pierce <= 0) {
            spent = true;
            break;
          }
        }
      }
      if (spent) bolts.splice(index, 1);
    }

    // Wisps keep a little distance from each other so the swarm reads as a crowd.
    const wisps = swarm.list;
    for (let a = 0; a < wisps.length; a += 1) {
      for (let b = a + 1; b < wisps.length; b += 1) {
        const first = wisps[a];
        const second = wisps[b];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const dist = Math.hypot(dx, dy);
        const min = first.radius + second.radius - 2;
        if (dist > 0 && dist < min) {
          const push = (min - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          first.x -= nx * push;
          first.y -= ny * push;
          second.x += nx * push;
          second.y += ny * push;
        }
      }
    }

    // A wisp that touches the keeper hurts them, then the keeper is briefly untouchable.
    for (const wisp of wisps) {
      if (player.invulnerable > 0) break;
      if (distance(wisp.x, wisp.y, player.x, player.y) <= wisp.radius + player.radius - 2) {
        player.hp -= wisp.damage;
        player.invulnerable = PLAYER.invulnerable;
        state.shake = 9;
        const dx = player.x - wisp.x;
        const dy = player.y - wisp.y;
        const dist = Math.hypot(dx, dy) || 1;
        player.x = Math.min(FIELD.width - player.radius, Math.max(player.radius, player.x + (dx / dist) * PLAYER.touchKnockback * dt * 4));
        player.y = Math.min(FIELD.height - player.radius, Math.max(player.radius, player.y + (dy / dist) * PLAYER.touchKnockback * dt * 4));
        particles.burst(player.x, player.y, '#ff6b6b', 12, 200);
        audio.hurt();
        events |= EVENT_HIT;
        if (player.hp <= 0) {
          player.hp = 0;
          state.over = true;
          return events | EVENT_OVER;
        }
        break;
      }
    }

    // Ember shards drift toward the keeper inside the magnet's reach, then are collected.
    for (let index = shards.length - 1; index >= 0; index -= 1) {
      const shard = shards[index];
      shard.bob += dt * 4;
      const dist = distance(shard.x, shard.y, player.x, player.y);
      if (dist <= player.magnetRadius) {
        const pull = SHARD.pullSpeed * dt;
        shard.x += ((player.x - shard.x) / (dist || 1)) * pull;
        shard.y += ((player.y - shard.y) / (dist || 1)) * pull;
      }
      if (dist <= SHARD.collectRadius) {
        shards.splice(index, 1);
        audio.pickup();
        events |= EVENT_PICKUP;
        if (gainXp(player, shard.value)) {
          state.levelUpChoices = rollUpgrades(random, player);
          audio.levelUp();
          return events | EVENT_LEVELUP;
        }
      }
    }

    if (state.shake > 0) state.shake = Math.max(0, state.shake - 30 * dt);
    particles.update(dt);
    return events;
  }

  /** Take one of the open level-up choices (by index) and close the choice. */
  function chooseUpgrade(index) {
    if (state.levelUpChoices === null) return false;
    const choice = state.levelUpChoices[index];
    if (!choice) return false;
    applyUpgrade(player, choice);
    state.levelUpChoices = null;
    return true;
  }

  reset();
  return { state, reset, step, chooseUpgrade, orbPositions };
}
