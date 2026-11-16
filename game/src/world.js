// Vanguard Protocol - Sector Zero Tactical Map
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createWorld(scene) {
  const colliders = [];
  const shootables = [];

  // Reusable tactical materials
  const wallMat = new THREE.MeshStandardMaterial({ color: PALETTE.surface, roughness: 0.85, metalness: 0.15 });
  const floorMat = new THREE.MeshStandardMaterial({ color: PALETTE.canvas, roughness: 0.9, metalness: 0.1 });
  const crateMat = new THREE.MeshStandardMaterial({ color: '#2b3340', roughness: 0.7, metalness: 0.3 });
  const siteAMat = new THREE.MeshStandardMaterial({ color: PALETTE.siteA, roughness: 0.3, metalness: 0.8, emissive: PALETTE.siteA, emissiveIntensity: 0.3 });
  const siteBMat = new THREE.MeshStandardMaterial({ color: PALETTE.siteB, roughness: 0.3, metalness: 0.8, emissive: PALETTE.siteB, emissiveIntensity: 0.3 });

  // Map limits
  const MAP_HALF_W = 24;
  const MAP_HALF_L = 30;
  const WALL_H = 7;

  // Floor & Ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_HALF_W * 2, MAP_HALF_L * 2), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  function addBox(w, h, d, x, y, z, mat = wallMat, isShootable = true) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const minX = x - w / 2;
    const maxX = x + w / 2;
    const minZ = z - d / 2;
    const maxZ = z + d / 2;
    colliders.push({ minX, maxX, minY: y, maxY: y + h, minZ, maxZ });
    if (isShootable) shootables.push(mesh);
    return mesh;
  }

  // 1. Perimeter Boundary Walls
  addBox(MAP_HALF_W * 2 + 2, WALL_H, 2, 0, 0, -MAP_HALF_L - 1); // North Wall
  addBox(MAP_HALF_W * 2 + 2, WALL_H, 2, 0, 0, MAP_HALF_L + 1);  // South Wall
  addBox(2, WALL_H, MAP_HALF_L * 2 + 2, -MAP_HALF_W - 1, 0, 0); // West Wall
  addBox(2, WALL_H, MAP_HALF_L * 2 + 2, MAP_HALF_W + 1, 0, 0);  // East Wall

  // 2. Central Courtyard Dividing Walls & Archways
  addBox(12, WALL_H, 1.5, -12, 0, 4);
  addBox(12, WALL_H, 1.5, 12, 0, 4);
  addBox(12, WALL_H, 1.5, -12, 0, -8);
  addBox(12, WALL_H, 1.5, 12, 0, -8);

  // Mid Sniper Pillars
  addBox(2, WALL_H, 2, -3.5, 0, -2);
  addBox(2, WALL_H, 2, 3.5, 0, -2);

  // Mid Tactical Monument / Cover Box
  addBox(4, 1.6, 4, 0, 0, -2, crateMat);
  addBox(2, 2.8, 2, 0, 0, -2, wallMat);

  // Sector 7 Perimeter Beacon Pillars
  const beaconMat = new THREE.MeshStandardMaterial({ color: PALETTE.cautionYellow, roughness: 0.2, emissive: PALETTE.cautionYellow, emissiveIntensity: 0.4 });
  addBox(0.6, 4.2, 0.6, -11.5, 0, 3.8, beaconMat);
  addBox(0.6, 4.2, 0.6, 11.5, 0, 3.8, beaconMat);
  addBox(0.6, 4.2, 0.6, -11.5, 0, -7.8, beaconMat);
  addBox(0.6, 4.2, 0.6, 11.5, 0, -7.8, beaconMat);

  // 3. Bombsite A (East Wing - Reactor Core)
  addBox(1.5, 3.5, 14, 6, 0, -2); // A-Long partition
  // Reactor platform & glowing core
  addBox(8, 0.8, 8, 16, 0, -2, crateMat);
  const coreMesh = addBox(2.2, 4.5, 2.2, 16, 0.8, -2, siteAMat);
  const coreLight = new THREE.PointLight(PALETTE.siteA, 3, 16);
  coreLight.position.set(16, 3, -2);
  scene.add(coreLight);

  // A Site Cover Crates
  addBox(2.2, 2, 1.2, 13, 0, -5, crateMat);
  addBox(1.6, 1.4, 2.4, 19, 0, 2, crateMat);

  // 4. Bombsite B (West Wing - Data Silo)
  addBox(1.5, 3.5, 14, -6, 0, -2); // B-Long partition
  // Server silo structure
  addBox(7, 0.8, 7, -16, 0, -2, crateMat);
  const dataMesh = addBox(2.5, 3.8, 2.5, -16, 0.8, -2, siteBMat);
  const dataLight = new THREE.PointLight(PALETTE.siteB, 3, 16);
  dataLight.position.set(-16, 3, -2);
  scene.add(dataLight);

  // B Site Cover Crates
  addBox(2.4, 2.2, 1.4, -13, 0, 1, crateMat);
  addBox(1.8, 1.6, 2.2, -18, 0, -6, crateMat);

  // 5. Spawn Area Barriers
  // Vanguard (South)
  addBox(6, 1.8, 1.5, 0, 0, 14, crateMat);
  addBox(3, 1.4, 2, -8, 0, 18, crateMat);
  addBox(3, 1.4, 2, 8, 0, 18, crateMat);

  // Syndicate (North)
  addBox(6, 1.8, 1.5, 0, 0, -18, crateMat);
  addBox(3, 1.4, 2, -7, 0, -22, crateMat);
  addBox(3, 1.4, 2, 7, 0, -22, crateMat);

  // 6. Tactical Lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
  dirLight.position.set(15, 25, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 70;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 35;
  dirLight.shadow.camera.bottom = -35;
  scene.add(dirLight);

  // Site Waypoint Coordinates for Bot AI & Objective
  const waypoints = {
    vanguardSpawn: new THREE.Vector3(0, 0, 22),
    syndicateSpawn: new THREE.Vector3(0, 0, -24),
    midCourtyard: new THREE.Vector3(0, 0, -2),
    siteA: new THREE.Vector3(16, 0, -2),
    siteB: new THREE.Vector3(-16, 0, -2),
    aLong: new THREE.Vector3(12, 0, 8),
    bLong: new THREE.Vector3(-12, 0, 8)
  };

  return {
    colliders,
    shootables,
    waypoints,
    coreMesh,
    dataMesh
  };
}
