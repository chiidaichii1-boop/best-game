// Sparks and floating words: the feedback layer. A burst is a handful of coloured
// dots that fly out, slow down and fade; a floating word rises and fades. The world
// asks for them when something happens (a wisp banished, a shard collected, the keeper
// hurt) and the renderer paints whatever is alive. Nothing here allocates per frame
// beyond the small arrays it owns.

export function createParticles() {
  const sparks = [];
  const words = [];

  return {
    sparks,
    words,
    burst(x, y, color, count, speed) {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const power = speed * (0.4 + Math.random() * 0.8);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * power,
          vy: Math.sin(angle) * power,
          life: 0.45 + Math.random() * 0.3,
          age: 0,
          size: 2 + Math.random() * 3,
          color,
        });
      }
    },
    word(x, y, text, color) {
      words.push({ x, y, text, color, life: 0.9, age: 0 });
    },
    update(dt) {
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.age += dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vx *= 1 - 2.4 * dt;
        spark.vy *= 1 - 2.4 * dt;
        if (spark.age >= spark.life) sparks.splice(index, 1);
      }
      for (let index = words.length - 1; index >= 0; index -= 1) {
        const word = words[index];
        word.age += dt;
        word.y -= 34 * dt;
        if (word.age >= word.life) words.splice(index, 1);
      }
    },
    reset() {
      sparks.length = 0;
      words.length = 0;
    },
  };
}
