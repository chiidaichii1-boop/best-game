# Lanternkeep

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/chiidaichii1-boop/best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/chiidaichii1-boop/best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Lanternkeep is a 2D top-down horde-survival game: you are the keeper of the last lantern in a twilight garden. Shadow wisps swarm in from the dark — your lantern's aura, orbiting ember orbs and aimed bolts banish them. Gather ember shards, level up and choose one of three blessings each level, and survive five minutes until dawn. Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` directly in a desktop browser — the game is plain static files and runs offline, no build step and no network requests.

## How to play

- **Move** with WASD or the arrow keys. **Fire a bolt** toward your cursor with a click or Space (hold to keep firing).
- **Survive until dawn** — five minutes on the clock. If your health reaches zero, the light goes out.
- **Banish wisps** with your lantern's aura (it burns anything standing in the light), your orbiting ember orbs, and your bolts. Banished wisps drop ember shards.
- **Collect embers** to level up; each level offers a choice of three blessings — more orbs, a wider aura, faster bolts, piercing shots, a stronger magnet, and more.
- **Wisps:** drifters are slow and weak, darters are fast and zigzag, splitters burst into two minis when banished, brutes are slow, tough and hit hard.
- **P** pauses, **M** mutes the sound, **1/2/3** (or a click) picks a level-up blessing. Your best score is kept in the browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7g64vnx0&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
