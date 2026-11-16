// Lanternkeep: every tuning number and colour in one place. The garden is a fixed
// 1280x720 logical field; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds of night to survive before dawn breaks and the run is won. */
export const DAWN_SECONDS = 300;

export const PLAYER = {
  radius: 16,
  speed: 265,
  maxHp: 100,
  invulnerable: 0.9,
  touchKnockback: 260,
};

/** The lantern's light: a halo that hurts every wisp standing inside it. Strong enough
 * to soften the swarm, not to wall it off: a drifter survives the crossing with a sliver
 * of health, so the keeper still has to move, dodge and shoot. */
export const AURA = {
  baseRadius: 88,
  baseDps: 14,
  radiusPerStack: 22,
  dpsPerStack: 0.35,
};

/** Ember orbs circle the keeper and burn wisps they touch. A drifter survives one orb
 * hit plus the aura, so the orbs thin the swarm rather than erase it. */
export const ORB = {
  baseCount: 1,
  orbitRadius: 72,
  angularSpeed: 3.1,
  radius: 10,
  baseDamage: 12,
  hitCooldown: 0.4,
};

/** A focused bolt, fired toward the cursor with a click or Space. */
export const BOLT = {
  speed: 640,
  radius: 6,
  baseDamage: 26,
  baseCooldown: 0.55,
  basePierce: 1,
};

/** Wisp kinds. hp, speed, radius, touch damage and the ember shards they drop. The
 * hit points are tuned against the aura and the orbs, so the common kinds mostly reach
 * the keeper and land a hit before the light finishes them. */
export const WISPS = {
  drifter: { hp: 22, speed: 68, radius: 13, damage: 6, xp: 1, color: '#b678f0', core: '#e3c8ff' },
  darter: { hp: 12, speed: 150, radius: 10, damage: 5, xp: 1, color: '#f06fb8', core: '#ffc2e2' },
  splitter: { hp: 30, speed: 82, radius: 15, damage: 8, xp: 2, color: '#8f7bff', core: '#cfc4ff' },
  brute: { hp: 84, speed: 46, radius: 22, damage: 14, xp: 3, color: '#7a4fd0', core: '#d9b8ff' },
  mini: { hp: 10, speed: 118, radius: 8, damage: 4, xp: 0, color: '#a58cff', core: '#e6dcff' },
};

/** How the swarm grows as the night goes on. */
export const SPAWN = {
  startInterval: 1.35,
  endInterval: 0.3,
  batchStart: 1,
  batchEnd: 4,
  maxAlive: 70,
  /** Seconds of night after which a kind first appears. */
  firstSeen: { drifter: 0, darter: 30, splitter: 75, brute: 120 },
};

/** Ember shards: how far they are pulled in, and how fast they fly to the keeper. */
export const SHARD = { radius: 7, pullSpeed: 420, collectRadius: 26 };

/** XP needed to reach the next level: 9, 13, 17, ... */
export const xpNeededFor = (level) => 5 + level * 4;

/** One wave is 30 seconds of night. */
export const waveOf = (elapsed) => Math.floor(elapsed / 30) + 1;

export const PALETTE = {
  backdrop: '#070a18',
  skyTop: '#131a3a',
  skyBottom: '#1d2340',
  garden: '#16283a',
  bush: '#1e4a3f',
  bushLight: '#2a6b52',
  flower: '#f2a65a',
  flowerPink: '#e58bb1',
  grass: '#2f6b4f',
  text: '#f4ead8',
  muted: '#9aa3c0',
  panel: '#1a2138',
  panelEdge: '#3a4a72',
  amber: '#ffb84d',
  amberBright: '#ffd98a',
  lantern: '#ffcf6e',
  hp: '#ff6b6b',
  hpBack: '#3a2330',
  xp: '#7ee2a8',
  xpBack: '#22303a',
  danger: '#ff5d7a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'lanternkeep.best';
