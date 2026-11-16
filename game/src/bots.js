// Vanguard Protocol - Tactical Bot AI & Squad Combat
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { SoundEngine } from './sound.js';

export function createBots(scene, waypoints, onBotKill) {
  const bots = [];
  const hitMeshes = [];

  const syndicateBodyMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.6, metalness: 0.2 });
  const syndicateHeadMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4, metalness: 0.4 });
  const visorMat = new THREE.MeshBasicMaterial({ color: '#f97316' });
  const weaponMat = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.3, metalness: 0.8 });

  // 4 Syndicate AI Operators
  const BOT_CONFIGS = [
    { name: 'Syn-Viper', site: 'siteA', x: 8, z: -23, weapon: 'ar15', hp: 100, armor: 100 },
    { name: 'Syn-Ghost', site: 'siteB', x: -8, z: -23, weapon: 'vector', hp: 100, armor: 50 },
    { name: 'Syn-Apex', site: 'midCourtyard', x: 0, z: -22, weapon: 'apex', hp: 100, armor: 100 },
    { name: 'Syn-Striker', site: 'siteA', x: 12, z: -21, weapon: 'p12', hp: 100, armor: 0 }
  ];

  BOT_CONFIGS.forEach((cfg, idx) => {
    const group = new THREE.Group();
    group.position.set(cfg.x, 0, cfg.z);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.85, 0.3);
    const torso = new THREE.Mesh(torsoGeo, syndicateBodyMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    torso.userData = { botIndex: idx, part: 'body', target: true };
    group.add(torso);
    hitMeshes.push(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.34, 0.3);
    const head = new THREE.Mesh(headGeo, syndicateHeadMat);
    head.position.y = 1.58;
    head.castShadow = true;
    head.userData = { botIndex: idx, part: 'head', target: true };
    group.add(head);
    hitMeshes.push(head);

    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), visorMat);
    visor.position.set(0, 1.58, 0.16);
    group.add(visor);

    // Handheld weapon
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.45), weaponMat);
    gun.position.set(0.3, 0.95, 0.32);
    group.add(gun);

    scene.add(group);

    bots.push({
      config: cfg,
      group,
      torso,
      head,
      gun,
      hp: cfg.hp,
      armor: cfg.armor,
      alive: true,
      targetWaypoint: waypoints[cfg.site] || waypoints.midCourtyard,
      shootTimer: 1.0 + Math.random() * 1.5,
      strafeTimer: 0,
      strafeDir: 1,
      velocity: new THREE.Vector3()
    });
  });

  function resetRound() {
    bots.forEach((bot, idx) => {
      const cfg = BOT_CONFIGS[idx];
      bot.alive = true;
      bot.hp = cfg.hp;
      bot.armor = cfg.armor;
      bot.group.visible = true;
      bot.group.rotation.set(0, 0, 0);
      bot.group.position.set(cfg.x, 0, cfg.z);
      bot.targetWaypoint = waypoints[cfg.site] || waypoints.midCourtyard;
      bot.shootTimer = 1.2 + Math.random();
    });
  }

  function damage(mesh, hitDamage, isHeadshot) {
    const idx = mesh.userData.botIndex;
    const bot = bots[idx];
    if (!bot || !bot.alive) return false;

    // Headshot calculation
    const finalDamage = isHeadshot ? hitDamage * 2.5 : hitDamage;
    bot.hp -= finalDamage;

    if (bot.hp <= 0) {
      bot.alive = false;
      bot.hp = 0;
      // Death animation: collapse backwards
      bot.group.rotation.x = -Math.PI / 2;
      bot.group.position.y = 0.2;
      SoundEngine.playHitmarker(true);
      if (onBotKill) onBotKill(bot.config.name, isHeadshot, idx);
      return true; // Killed!
    }
    SoundEngine.playHitmarker(isHeadshot);
    return false;
  }

  function remainingCount() {
    return bots.filter((b) => b.alive).length;
  }

  function aimPoint(index) {
    const bot = bots[index];
    if (!bot) return new THREE.Vector3();
    return new THREE.Vector3(bot.group.position.x, 1.58, bot.group.position.z);
  }

  function step(dt, playerPos, onBotShootPlayer) {
    bots.forEach((bot) => {
      if (!bot.alive) return;

      const botPos = bot.group.position;
      const distToPlayer = botPos.distanceTo(playerPos);

      // Look toward target (Player if close, else Waypoint)
      const lookTarget = distToPlayer < 28 ? playerPos : bot.targetWaypoint;
      const angle = Math.atan2(lookTarget.x - botPos.x, lookTarget.z - botPos.z);
      bot.group.rotation.y = angle;

      // Combat engagement logic
      if (distToPlayer < 24) {
        // In engagement range: strafe and shoot
        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) {
          bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
          bot.strafeTimer = 1.0 + Math.random();
        }
        const rightX = Math.cos(angle);
        const rightZ = -Math.sin(angle);
        botPos.x += rightX * bot.strafeDir * 1.5 * dt;
        botPos.z += rightZ * bot.strafeDir * 1.5 * dt;

        // Shoot at player
        bot.shootTimer -= dt;
        if (bot.shootTimer <= 0) {
          bot.shootTimer = bot.config.weapon === 'apex' ? 2.2 : bot.config.weapon === 'vector' ? 0.35 : 0.8;
          SoundEngine.playGunshot(bot.config.weapon === 'apex' ? 'sniper' : 'rifle');
          if (onBotShootPlayer) {
            const hitProb = distToPlayer < 10 ? 0.6 : 0.35;
            if (Math.random() < hitProb) {
              const dmg = bot.config.weapon === 'apex' ? 45 : 18;
              onBotShootPlayer(dmg);
            }
          }
        }
      } else {
        // Move toward waypoint
        const dx = bot.targetWaypoint.x - botPos.x;
        const dz = bot.targetWaypoint.z - botPos.z;
        const distToWay = Math.hypot(dx, dz);
        if (distToWay > 1.0) {
          botPos.x += (dx / distToWay) * 3.2 * dt;
          botPos.z += (dz / distToWay) * 3.2 * dt;
        }
      }
    });
  }

  return {
    items: bots,
    hitMeshes,
    damage,
    remaining: remainingCount,
    reset: resetRound,
    aimPoint,
    step
  };
}
