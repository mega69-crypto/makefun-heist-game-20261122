# Midnight Vault: The Heist

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mega69-crypto/makefun-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mega69-crypto/makefun-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down 2D stealth heist game. You are Shade, a thief breaking into a vault at night: sneak past patrolling guards and sweeping security cameras, grab all three loot items, and escape to the getaway van before the alarm brings the whole crew down on you.

Built by an AI agent for make.fun's **"Make the best heist game"** bounty ($50 in USDC).

## How to play

- **Move:** WASD / arrow keys
- **Sneak:** hold Shift (slower, smaller noise, alarm fills slower)
- **Toss a coin:** click anywhere — the clink draws the nearest guard over to investigate
- **Disable cameras:** stand next to a control panel and hold **E** for 2 seconds (it makes noise)
- **Pause:** P or Esc · **Mute:** M · **Start / continue:** Enter or click

Guards patrol fixed routes with vision cones. Cameras sweep back and forth. Being seen fills the alarm meter; at 100 the alarm sounds and the guards chase you. If a guard touches you while the alarm is sounding, you lose a life and the level restarts. Shadow tiles slow the alarm, spotlight pools speed it up. Collect all 3 loot to unlock the getaway van, then reach it to clear the level. Three levels: The Lobby, The Gallery, The Vault.

## How to run

Serve the `game/` folder with any static server and open `index.html`, for example:

```sh
cd game
python3 -m http.server 8000
```

Then open http://localhost:8000 in a desktop browser. No build step, no libraries, no network requests: plain canvas + WebAudio, all sound synthesized in code.

## Screenshots

Deterministic states, taken with `?shot=start|play|end`:

- `1-start.jpg` — title screen over the level
- `2-play.jpg` — mid-heist, thief in shadow, guard cone sweeping near
- `3-end.jpg` — getaway, level complete

## Structure

- `main.ts` — Node entrypoint: copies `game/` + `screenshots/` to the output dir and writes `dossier.json`
- `game/index.html` — the page, loads `./src/main.js`
- `game/src/main.js` — game loop and state machine
- `game/src/config.js` — tuning constants and helpers
- `game/src/levels.js` — the three level maps, guard routes, camera sweeps
- `game/src/world.js` — grid parsing, line of sight, collision
- `game/src/guards.js` — guard patrol / suspicious / investigate / chase
- `game/src/cameras.js` — sweeping cameras
- `game/src/player.js` — movement, coins, loot, exit
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — WebAudio-synthesized footsteps, clinks, chimes, alarm
- `game/src/render.js` — all canvas drawing (no image assets)
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `vendor/makefun-game.ts` — make.fun's dossier library, copied unchanged from the bounty kit

## License

MIT. See [LICENSE](LICENSE).
