# stealth-entry

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Iqbal17/stealth-entry/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Iqbal17/stealth-entry/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Hushlight** is a top-down 2D stealth game set in a lamp-lit depot at night.
You are a courier with one job: slip past the patrols, take the ledger, and
reach the exit gate unseen. Three floors of rising difficulty — the Night
Yard, the Aisles, and the Vault Floor, where the ledger sleeps in a guarded
alcove.

How it plays:

- **Vision cones that tell the truth.** Every guard projects a cone that is
  raycast against the room, so walls, crates and bushes bite real chunks out
  of it — what you see is exactly what the guard sees. Guards patrol waypoint
  loops, pause at each stop, and slowly scan the lane while they wait.
- **A detection meter that forgives — once.** Each guard's suspicion fills
  while you are in their cone with a clear line of sight: faster when you are
  close, faster when you move at full speed. Break line of sight and it
  drains, so a near miss can still be recovered. A full meter is a caught
  courier and a restarted level.
- **Sneak mode.** Hold **Shift** to move slowly and quietly — your suspicion
  fills at a third of the normal rate. Bushes hide you completely unless a
  guard is nearly on top of you.
- **Ears as a second sense.** Guard footsteps are synthesised with WebAudio
  and grow louder as a guard nears, so you can hear a patrol coming around a
  shelf before its cone rounds the corner.
- **Controls:** WASD or arrow keys to move, Shift to sneak, R to restart the
  level, Enter or click to start and to retry.

Everything is drawn on canvas at run time — the depot floor, the warm lamp
pools, the crates and shelf walls, the pulsing ledger and the exit gate — and
all sound is synthesised in code. No libraries, no assets, no network: the
whole game is static files under `game/`, split into one file per job
(`levels`, `geometry`, `guards`, `player`, `detection`, `render`, `audio`,
and the `game` loop).

For screenshots the game stages genuine mid-game moments with URL parameters,
e.g. `?shot=alarm&level=1` (also `cover`, `play` and `exit`): it loads the
real level, places the courier and guards from the shot data in `levels.js`,
and renders that frame with the normal code.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Any static file server pointed at `game/` works just as well. Hand it in with
`MAKEFUN_OUTPUT_DIR=out node main.ts` (copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=sjc4apwe&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
