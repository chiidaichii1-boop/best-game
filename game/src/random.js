// A small seeded random source (mulberry32) so a run can be replayed from one number:
// screenshots stage their scenes with a fixed seed, and the game itself takes a seed
// at boot. Nothing here touches Math.random.

export function createRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    angle() {
      return next() * Math.PI * 2;
    },
  };
}
