// The lantern keeper: where they stand, how hard they are to kill, and everything the
// upgrades have bought them. The numbers here are the *current* values (base plus
// stacks), and `stacks` records how many times each upgrade was taken, so the upgrade
// pool knows what is maxed out.

import { AURA, BOLT, FIELD, ORB, PLAYER, SHARD, xpNeededFor } from './config.js';

export function createPlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    invulnerable: 0,
    face: -Math.PI / 2,
    level: 1,
    xp: 0,
    xpNeeded: xpNeededFor(1),
    orbCount: ORB.baseCount,
    orbAngle: 0,
    auraRadius: AURA.baseRadius,
    auraDps: AURA.baseDps,
    boltDamage: BOLT.baseDamage,
    boltCooldown: BOLT.baseCooldown,
    boltPierce: BOLT.basePierce,
    boltTimer: 0,
    moveSpeed: PLAYER.speed,
    magnetRadius: 90,
    xpMult: 1,
    orbSpeedMult: 1,
    orbDamageMult: 1,
    stacks: {},
  };
}

export function resetPlayer(player) {
  const fresh = createPlayer();
  for (const key of Object.keys(fresh)) player[key] = fresh[key];
  player.stacks = {};
}

/** Move the keeper with a normalised steering vector, clamped inside the garden. */
export function movePlayer(player, direction, dt) {
  player.vx = direction.x * player.moveSpeed;
  player.vy = direction.y * player.moveSpeed;
  player.x = Math.min(FIELD.width - player.radius, Math.max(player.radius, player.x + player.vx * dt));
  player.y = Math.min(FIELD.height - player.radius, Math.max(player.radius, player.y + player.vy * dt));
  if (direction.x !== 0 || direction.y !== 0) player.face = Math.atan2(direction.y, direction.x);
  if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
  if (player.boltTimer > 0) player.boltTimer = Math.max(0, player.boltTimer - dt);
}

/** Add XP; returns true when the keeper just crossed into a new level. */
export function gainXp(player, amount) {
  player.xp += amount * player.xpMult;
  if (player.xp < player.xpNeeded) return false;
  player.xp -= player.xpNeeded;
  player.level += 1;
  player.xpNeeded = xpNeededFor(player.level);
  return true;
}

/** Apply one upgrade definition to the keeper and record the stack. */
export function applyUpgrade(player, upgrade) {
  player.stacks[upgrade.id] = (player.stacks[upgrade.id] ?? 0) + 1;
  switch (upgrade.id) {
    case 'orb':
      player.orbCount += 1;
      break;
    case 'glow':
      player.auraRadius += AURA.radiusPerStack;
      break;
    case 'hot':
      player.auraDps *= 1 + AURA.dpsPerStack;
      break;
    case 'bolt':
      player.boltCooldown *= 0.82;
      player.boltDamage *= 1.15;
      break;
    case 'pierce':
      player.boltPierce += 1;
      break;
    case 'boots':
      player.moveSpeed *= 1.12;
      break;
    case 'magnet':
      player.magnetRadius += 45;
      break;
    case 'sturdy':
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
      break;
    case 'rich':
      player.xpMult *= 1.25;
      break;
    case 'hands':
      player.orbSpeedMult *= 1.25;
      player.orbDamageMult *= 1.2;
      break;
    case 'meal':
      player.hp = Math.min(player.maxHp, player.hp + 40);
      break;
    default:
      break;
  }
}
