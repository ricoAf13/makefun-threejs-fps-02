// Vanguard Protocol - Weapons Arsenal & Tactical Ballistics
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { SoundEngine } from './sound.js';

export const WEAPON_CONFIGS = {
  p12: {
    id: 'p12',
    name: 'P12 Tactical',
    slot: 'secondary',
    price: 200,
    damage: 28,
    headshotMult: 2.5,
    mag: 12,
    reserve: 48,
    fireGap: 0.22,
    reloadTime: 1.4,
    recoilPitch: 0.009,
    recoilYaw: 0.004,
    standSpread: 0.004,
    moveSpread: 0.018,
    soundType: 'pistol'
  },
  vector: {
    id: 'vector',
    name: 'Vector-9 SMG',
    slot: 'primary',
    price: 1250,
    damage: 24,
    headshotMult: 2.2,
    mag: 30,
    reserve: 120,
    fireGap: 0.075,
    reloadTime: 1.8,
    recoilPitch: 0.007,
    recoilYaw: 0.006,
    standSpread: 0.008,
    moveSpread: 0.025,
    soundType: 'smg'
  },
  ar15: {
    id: 'ar15',
    name: 'AR-24 Carbine',
    slot: 'primary',
    price: 2700,
    damage: 34,
    headshotMult: 3.0,
    mag: 30,
    reserve: 90,
    fireGap: 0.096,
    reloadTime: 2.1,
    recoilPitch: 0.012,
    recoilYaw: 0.005,
    standSpread: 0.003,
    moveSpread: 0.045,
    soundType: 'rifle'
  },
  apex: {
    id: 'apex',
    name: 'Apex-50 Sniper',
    slot: 'primary',
    price: 4750,
    damage: 110,
    headshotMult: 4.0,
    mag: 5,
    reserve: 20,
    fireGap: 1.15,
    reloadTime: 2.8,
    recoilPitch: 0.038,
    recoilYaw: 0.012,
    standSpread: 0.001,
    moveSpread: 0.09,
    soundType: 'sniper'
  }
};

export function createWeaponManager(camera) {
  const root = new THREE.Group();
  camera.add(root);

  // Weapon viewmodels
  const models = {};
  const darkMat = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.4, metalness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: PALETTE.hairline, roughness: 0.3, metalness: 0.8 });
  const accentMat = new THREE.MeshStandardMaterial({ color: PALETTE.vanguardBlue, roughness: 0.5, metalness: 0.3 });

  // Muzzle flash light
  const flashLight = new THREE.PointLight(0xffaa33, 0, 8);
  flashLight.position.set(0.18, -0.16, -0.9);
  root.add(flashLight);

  // 1. AR-24 Model
  const arGroup = new THREE.Group();
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.38), darkMat);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 10), metalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.32);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.08), darkMat);
  mag.position.set(0, -0.11, 0.02);
  mag.rotation.x = 0.2;
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.12), accentMat);
  sight.position.set(0, 0.065, -0.05);
  arGroup.add(receiver, barrel, mag, sight);
  arGroup.position.set(0.2, -0.22, -0.42);
  root.add(arGroup);
  models.ar15 = arGroup;

  // 2. Vector-9 Model
  const smgGroup = new THREE.Group();
  const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.28), darkMat);
  const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.06), metalMat);
  smgMag.position.set(0, -0.12, 0.06);
  const smgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.05), accentMat);
  smgGrip.position.set(0, -0.08, -0.08);
  smgGroup.add(smgBody, smgMag, smgGrip);
  smgGroup.position.set(0.18, -0.2, -0.38);
  smgGroup.visible = false;
  root.add(smgGroup);
  models.vector = smgGroup;

  // 3. P12 Pistol Model
  const pGroup = new THREE.Group();
  const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.2), metalMat);
  const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.06), darkMat);
  pGrip.position.set(0, -0.07, 0.04);
  pGrip.rotation.x = 0.25;
  pGroup.add(pSlide, pGrip);
  pGroup.position.set(0.18, -0.18, -0.35);
  pGroup.visible = false;
  root.add(pGroup);
  models.p12 = pGroup;

  // 4. Apex Sniper Model
  const sniperGroup = new THREE.Group();
  const snBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.5), darkMat);
  const snBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 12), metalMat);
  snBarrel.rotation.x = Math.PI / 2;
  snBarrel.position.set(0, 0.02, -0.45);
  const snScope = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.25, 12), accentMat);
  snScope.rotation.x = Math.PI / 2;
  snScope.position.set(0, 0.08, -0.08);
  sniperGroup.add(snBody, snBarrel, snScope);
  sniperGroup.position.set(0.22, -0.24, -0.48);
  sniperGroup.visible = false;
  root.add(sniperGroup);
  models.apex = sniperGroup;

  // Active state
  let currentKey = 'ar15';
  let config = WEAPON_CONFIGS[currentKey];
  const ammoState = {
    ar15: { mag: config.mag, reserve: config.reserve },
    vector: { mag: WEAPON_CONFIGS.vector.mag, reserve: WEAPON_CONFIGS.vector.reserve },
    p12: { mag: WEAPON_CONFIGS.p12.mag, reserve: WEAPON_CONFIGS.p12.reserve },
    apex: { mag: WEAPON_CONFIGS.apex.mag, reserve: WEAPON_CONFIGS.apex.reserve }
  };

  let cooldown = 0;
  let reloadTimer = 0;
  let isReloading = false;
  let kick = 0;
  let flashTimer = 0;

  function switchWeapon(key) {
    if (!WEAPON_CONFIGS[key] || key === currentKey) return;
    currentKey = key;
    config = WEAPON_CONFIGS[key];
    cooldown = 0.25;
    reloadTimer = 0;
    isReloading = false;

    Object.keys(models).forEach((k) => {
      models[k].visible = k === currentKey;
    });
  }

  function ready() {
    return cooldown <= 0 && !isReloading && ammoState[currentKey].mag > 0;
  }

  function pullTrigger() {
    if (!ready()) return false;
    ammoState[currentKey].mag -= 1;
    cooldown = config.fireGap;
    kick = config.id === 'apex' ? 0.06 : 0.035;
    flashTimer = 0.05;
    flashLight.intensity = 2.5;
    SoundEngine.playGunshot(config.soundType);
    return true;
  }

  function reload() {
    const curAmmo = ammoState[currentKey];
    if (isReloading || curAmmo.mag >= config.mag || curAmmo.reserve <= 0) return;
    isReloading = true;
    reloadTimer = config.reloadTime;
    SoundEngine.playReload();
  }

  function refillAll() {
    Object.keys(WEAPON_CONFIGS).forEach((k) => {
      ammoState[k].mag = WEAPON_CONFIGS[k].mag;
      ammoState[k].reserve = WEAPON_CONFIGS[k].reserve;
    });
    isReloading = false;
    reloadTimer = 0;
    cooldown = 0;
  }

  function step(dt) {
    if (cooldown > 0) cooldown -= dt;
    if (flashTimer > 0) {
      flashTimer -= dt;
      if (flashTimer <= 0) flashLight.intensity = 0;
    }

    if (isReloading) {
      reloadTimer -= dt;
      if (reloadTimer <= 0) {
        const curAmmo = ammoState[currentKey];
        const needed = config.mag - curAmmo.mag;
        const take = Math.min(needed, curAmmo.reserve);
        curAmmo.mag += take;
        curAmmo.reserve -= take;
        isReloading = false;
      }
    }

    // Weapon sway & kick animation
    kick = Math.max(0, kick - dt * 0.35);
    const activeModel = models[currentKey];
    if (activeModel) {
      activeModel.position.z = (currentKey === 'apex' ? -0.48 : currentKey === 'p12' ? -0.35 : -0.42) + kick;
      activeModel.rotation.x = isReloading ? -0.3 : kick * 2;
    }
  }

  function spread(groundSpeed) {
    const moveFactor = Math.min(1, groundSpeed / 5);
    return config.standSpread + moveFactor * config.moveSpread;
  }

  return {
    root,
    get current() {
      return config;
    },
    get state() {
      return ammoState[currentKey];
    },
    ready,
    pullTrigger,
    reload,
    switchWeapon,
    refillAll,
    step,
    spread
  };
}
