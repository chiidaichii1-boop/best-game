// The level-up choices: what the keeper can be offered, how many times each stacks,
// and how three distinct, not-yet-maxed offers are rolled. A choice changes how the
// run plays — more orbs, a wider or hotter glow, faster bolts that pierce, quicker feet,
// a stronger magnet, a sturdier lantern, richer embers. When everything is maxed out
// the keeper is offered a hearty meal instead, so a level-up is never wasted.

export const UPGRADE_DEFS = [
  { id: 'orb', name: 'Ember Orb', desc: '+1 ember orb circling you', max: 4 },
  { id: 'glow', name: 'Wider Glow', desc: 'Lantern aura +22 radius', max: 4 },
  { id: 'hot', name: 'Hotter Glow', desc: 'Aura burns +35% harder', max: 5 },
  { id: 'bolt', name: 'Swift Bolt', desc: 'Bolts fire faster and hit +15% harder', max: 4 },
  { id: 'pierce', name: 'Piercing Bolt', desc: 'Each bolt passes through +1 wisp', max: 3 },
  { id: 'boots', name: 'Swift Boots', desc: 'Move +12% faster', max: 4 },
  { id: 'magnet', name: 'Strong Magnet', desc: 'Ember shards fly to you from +45 farther', max: 4 },
  { id: 'sturdy', name: 'Sturdy Lantern', desc: '+25 max health and heal 25', max: 4 },
  { id: 'rich', name: 'Rich Embers', desc: 'Earn +25% XP from shards', max: 3 },
  { id: 'hands', name: 'Quick Hands', desc: 'Orbs circle +25% faster and hit +20% harder', max: 3 },
];

export const MEAL = { id: 'meal', name: 'Hearty Meal', desc: 'Restore 40 health', max: 99 };

/** Three distinct offers the keeper has not maxed out yet, in a shuffled order. */
export function rollUpgrades(random, player) {
  const open = UPGRADE_DEFS.filter((def) => (player.stacks[def.id] ?? 0) < def.max);
  const picks = [];
  const pool = [...open];
  while (picks.length < 3 && pool.length > 0) {
    const index = Math.floor(random.next() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  while (picks.length < 3) picks.push(MEAL);
  return picks;
}
