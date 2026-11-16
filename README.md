# Vanguard Protocol: Sector Zero - Three.js Tactical FPS

[![make.fun](https://make.fun/b/threejs-fps-02/badge.svg)](https://make.fun/bounty/threejs-fps-02)

**Vanguard Protocol: Sector Zero** is an original round-based tactical first-person shooter built on Three.js (WebGL 2), developed for the [make.fun](https://make.fun) `threejs-fps-02` competition ($1,000 USDC Bounty).

---

## 🎯 Tactical Gameplay & CS-Style Features

1. **Round-Based Match Structure:**
   - Standard match format (Best of 9 rounds, first to 5 wins).
   - 90-second tactical combat clock per round.
   - Elimination win condition: Wipe out the opposing faction or secure the neural sites.

2. **Full In-Game Economy & Armory:**
   - Starting cash ($800) with round win bonuses ($3,250), loss streaks, and kill bounties ($300).
   - Dynamic Buy Menu (Hotkey `[B]`):
     - `[1]` P12 Tactical Sidearm ($200)
     - `[2]` Vector-9 Tactical SMG ($1,250)
     - `[3]` AR-24 Strike Carbine ($2,700)
     - `[4]` Apex-50 Precision Heavy Sniper ($4,750)
     - `[5]` Kevlar Body Armor + Helmet ($1,000)

3. **Gunplay & Ballistics:**
   - Movement spread penalty: moving or sprinting degrades bullet accuracy; standing still or crouching maximizes precision.
   - Recoil climb and procedural recovery.
   - Lethal headshot damage multiplier (up to 4x on sniper rifles).

4. **Tactical AI Bot Squad:**
   - 4 Syndicate operators with individual loadouts and waypoint navigation.
   - Raycasted engagement states, burst fire, strafing, and procedural audio.

5. **Pure Procedural Web Audio API Soundscape:**
   - Realistic multi-layered audio synthesis for gunshots, reloads, hitmarkers, buy chimes, and round horns. Zero external audio file dependencies.

---

## 🕹️ Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Tactical Movement |
| `Mouse` | Look & Aim (Pointer Lock) |
| `Left Click` | Fire Weapon |
| `R` | Tactical Reload |
| `B` | Open / Close Armory Buy Menu |
| `1` - `4` | Weapon Switch |
| `Space` | Jump |
| `Ctrl` / `C` | Crouch Stance |

---

## 🚀 Running Locally

To run the local static server:
```bash
node serve.ts
# Open http://localhost:8080 in desktop Chrome
```

To run the entry packager outside the grading container:
```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

## 📜 License

[MIT License](LICENSE) (SPDX-License-Identifier: MIT)
