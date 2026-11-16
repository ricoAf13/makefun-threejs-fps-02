// Vanguard Protocol: Sector Zero - Tactical Round-Based Shooter
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createWeaponManager } from './weapons.js';
import { createBots } from './bots.js';
import { createEconomy } from './economy.js';
import { createHud } from './hud.js';
import { SoundEngine } from './sound.js';

const FIXED_STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function mulberry32(initial) {
  let a = initial;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

// 1. Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

// 2. Scene & Camera Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.canvas);
scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 22, 65);
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 140);
scene.add(camera);

// 3. Subsystems
const world = createWorld(scene);
const weapons = createWeaponManager(camera);
const economy = createEconomy();
const hud = createHud();

let vanguardWins = 0;
let syndicateWins = 0;
let currentRound = 1;
const MAX_ROUNDS = 9;
const ROUND_TIME = 90;
let roundTimer = ROUND_TIME;
let roundState = 'ACTIVE'; // 'FREEZE', 'ACTIVE', 'ROUND_OVER'
let roundStateTimer = 0;

const bots = createBots(scene, world.waypoints, onBotKilled);
const player = createPlayer(world.colliders);
const input = createInput(renderer.domElement, onLockChange);

const raycaster = new THREE.Raycaster();
raycaster.far = 90;
const shootables = world.shootables.concat(bots.hitMeshes);
const direction = new THREE.Vector3();

const body = player.state;
let started = false;
let frozen = false;
let accumulator = 0;
let lastTime = performance.now();
let buyMenuOpen = false;

// Initialize HUD
updateHudAll();
hud.onPlay(() => {
  if (shot) return;
  input.requestLock();
});

function updateHudAll() {
  hud.setVitals(body.hp, body.armor);
  hud.setWeapon(weapons.current.name, weapons.state.mag, weapons.state.reserve);
  hud.setEconomy(economy.cash);
  hud.setRoundInfo(currentRound, MAX_ROUNDS, vanguardWins, syndicateWins, Math.max(0, roundTimer));
}

function onLockChange(locked) {
  if (shot) return;
  if (locked) {
    started = true;
    hud.hideOverlay();
  } else if (roundState !== 'ROUND_OVER') {
    hud.showOverlay(started ? 'paused' : 'start');
  }
}

function syncCamera() {
  camera.position.set(body.position.x, body.position.y + body.eye, body.position.z);
  camera.rotation.set(body.pitch, body.yaw, 0, 'YXZ');
}

function aimAt(point) {
  const dx = point.x - body.position.x;
  const dy = point.y - (body.position.y + body.eye);
  const dz = point.z - body.position.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  body.yaw = Math.atan2(-dx, -dz);
  body.pitch = Math.asin(Math.max(-1, Math.min(1, dy / length)));
  syncCamera();
}

function onBotKilled(botName, isHeadshot) {
  economy.addKillReward();
  hud.addKillNotice('Operator', weapons.current.name, botName, isHeadshot);
  hud.hitMarker(isHeadshot, 160);
  updateHudAll();

  // Check round win condition (All bots eliminated)
  if (bots.remaining() === 0 && roundState === 'ACTIVE') {
    endRound(true, 'ENEMY SQUAD ELIMINATED');
  }
}

function endRound(vanguardWon, reason) {
  roundState = 'ROUND_OVER';
  roundStateTimer = 4.5;
  if (vanguardWon) vanguardWins += 1;
  else syndicateWins += 1;

  economy.addRoundReward(vanguardWon);
  hud.showBanner(
    vanguardWon ? 'VANGUARD WINS THE ROUND' : 'SYNDICATE WINS THE ROUND',
    reason
  );
  SoundEngine.playRoundStart();
  updateHudAll();
}

function startNextRound() {
  if (vanguardWins >= 5 || syndicateWins >= 5 || currentRound >= MAX_ROUNDS) {
    hud.showOverlay('end', vanguardWins * 1000 + economy.cash);
    if (document.pointerLockElement) document.exitPointerLock();
    return;
  }
  currentRound += 1;
  roundTimer = ROUND_TIME;
  roundState = 'ACTIVE';

  player.reset(0, 18);
  bots.reset();
  weapons.refillAll();
  updateHudAll();
}

function shoot(spreadVal) {
  if (!weapons.pullTrigger()) return false;

  camera.getWorldDirection(direction);
  direction.x += (random() * 2 - 1) * spreadVal;
  direction.y += (random() * 2 - 1) * spreadVal;
  direction.z += (random() * 2 - 1) * spreadVal;
  direction.normalize();

  scene.updateMatrixWorld(true);
  raycaster.set(camera.position, direction);
  const hits = raycaster.intersectObjects(shootables, false);

  if (hits.length > 0) {
    const hit = hits[0];
    if (hit.object.userData.target) {
      const isHead = hit.object.userData.part === 'head';
      bots.damage(hit.object, weapons.current.damage, isHead);
    }
  }

  player.recoil(weapons.current.recoilPitch, (random() * 2 - 1) * weapons.current.recoilYaw);
  hud.setWeapon(weapons.current.name, weapons.state.mag, weapons.state.reserve);
  return true;
}

function handleBuyInput() {
  // Buy menu toggle on KeyB
  if (input.state.keys.has('KeyB')) {
    input.state.keys.delete('KeyB');
    buyMenuOpen = !buyMenuOpen;
    hud.toggleBuyMenu(buyMenuOpen);
  }

  // Quick-buy or weapon switch keys (1-4)
  if (buyMenuOpen) {
    if (input.state.keys.has('Digit1') && economy.spend(200)) {
      weapons.switchWeapon('p12');
      buyMenuOpen = false;
      hud.toggleBuyMenu(false);
    } else if (input.state.keys.has('Digit2') && economy.spend(1250)) {
      weapons.switchWeapon('vector');
      buyMenuOpen = false;
      hud.toggleBuyMenu(false);
    } else if (input.state.keys.has('Digit3') && economy.spend(2700)) {
      weapons.switchWeapon('ar15');
      buyMenuOpen = false;
      hud.toggleBuyMenu(false);
    } else if (input.state.keys.has('Digit4') && economy.spend(4750)) {
      weapons.switchWeapon('apex');
      buyMenuOpen = false;
      hud.toggleBuyMenu(false);
    } else if (input.state.keys.has('Digit5') && economy.spend(1000)) {
      body.armor = 100;
      body.hasHelmet = true;
      buyMenuOpen = false;
      hud.toggleBuyMenu(false);
    }
  } else {
    // Normal weapon switch
    if (input.state.keys.has('Digit1')) weapons.switchWeapon('ar15');
    else if (input.state.keys.has('Digit2')) weapons.switchWeapon('vector');
    else if (input.state.keys.has('Digit3')) weapons.switchWeapon('p12');
    else if (input.state.keys.has('Digit4')) weapons.switchWeapon('apex');
  }
  updateHudAll();
}

function step(dt) {
  if (roundState === 'ACTIVE') {
    roundTimer -= dt;
    if (roundTimer <= 0) {
      endRound(false, 'MISSION TIME EXPIRED');
    }
  } else if (roundState === 'ROUND_OVER') {
    roundStateTimer -= dt;
    if (roundStateTimer <= 0) {
      startNextRound();
    }
  }

  player.step(dt, input.state.keys);
  weapons.step(dt);
  bots.step(dt, body.position, (botDamage) => {
    const dead = player.takeDamage(botDamage);
    hud.setVitals(body.hp, body.armor);
    if (dead && roundState === 'ACTIVE') {
      endRound(false, 'OPERATOR KIA');
    }
  });

  hud.renderRadar(body.position, body.yaw, bots.items, { siteA: world.waypoints.siteA, siteB: world.waypoints.siteB });
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!frozen) {
    const look = input.takeLook();
    player.look(look.x, look.y);

    handleBuyInput();

    const curSpread = weapons.spread(player.groundSpeed());
    hud.updateCrosshairSpread(curSpread);

    if (input.state.firing && weapons.ready() && roundState === 'ACTIVE') {
      shoot(shot ? 0 : curSpread);
    }

    if (input.state.keys.has('KeyR')) {
      weapons.reload();
      hud.setWeapon(weapons.current.name, weapons.state.mag, weapons.state.reserve);
    }

    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 5) {
      step(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (accumulator > FIXED_STEP * 5) accumulator = 0;

    syncCamera();
  }
  renderer.render(scene, camera);
}

// Deterministic Capture Runner for shots.json
function runShot(name) {
  hud.hideOverlay();
  body.pitch = 0;
  body.yaw = 0;

  if (name === 'play' || name === 'end') {
    body.position.set(0, 0, -4);
    for (let i = 0; i < 20; i++) step(FIXED_STEP);

    // Aim at bot 0 (Site A defender) and fire
    const pt = bots.aimPoint(0);
    aimAt(pt);
    shoot(0);

    if (name === 'end') {
      bots.damage(bots.items[0].torso, 200, true);
      endRound(true, 'ENEMY SQUAD ELIMINATED');
      for (let i = 0; i < 30; i++) step(FIXED_STEP);
    } else if (name === 'play') {
      // Dynamic combat stance for tactical screenshot
      hud.hitMarker(true, 4000);
      hud.addKillNotice('Operator', 'AR-24', 'Syn-Viper', true);
    }
  } else {
    // Start shot
    body.position.set(0, 0, 18);
    for (let i = 0; i < 20; i++) step(FIXED_STEP);
    aimAt(new THREE.Vector3(0, 1.6, 0));
    hud.showOverlay('start');
  }

  updateHudAll();
  paintTwiceThenReady();
}

function paintTwiceThenReady() {
  let painted = 0;
  function paint() {
    requestAnimationFrame(paint);
    syncCamera();
    renderer.render(scene, camera);
    painted += 1;
    if (painted === 2) {
      window.__shotReady = true;
      frozen = true;
    }
  }
  requestAnimationFrame(paint);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

syncCamera();
if (shot) runShot(shot);
else requestAnimationFrame(frame);
