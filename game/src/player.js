// Vanguard Protocol - Player Controller, Physics & Health
import * as THREE from 'three';

const RADIUS = 0.36;
const STAND_HEIGHT = 1.72;
const CROUCH_HEIGHT = 1.12;
const STAND_EYE = 1.58;
const CROUCH_EYE = 1.0;
const ACCEL_GROUND = 62;
const ACCEL_AIR = 12;
const FRICTION = 9.5;
const GRAVITY = 24;
const JUMP_VELOCITY = 6.8;
const MAX_GROUND_SPEED = 6.4;

export function createPlayer(colliders) {
  const state = {
    position: new THREE.Vector3(0, 0, 18),
    velocity: new THREE.Vector3(),
    pitch: 0,
    yaw: 0,
    eye: STAND_EYE,
    height: STAND_HEIGHT,
    crouching: false,
    grounded: false,
    recoilPitch: 0,
    recoilYaw: 0,
    hp: 100,
    armor: 100,
    hasHelmet: true
  };

  function look(dx, dy) {
    const SENS = 0.0022;
    state.yaw -= dx * SENS;
    state.pitch -= dy * SENS;
    const LIMIT = Math.PI / 2 - 0.04;
    state.pitch = Math.max(-LIMIT, Math.min(LIMIT, state.pitch));
  }

  function recoil(pitchKick, yawKick) {
    state.pitch += pitchKick;
    state.yaw += yawKick;
    state.recoilPitch += pitchKick;
    state.recoilYaw += yawKick;
  }

  function takeDamage(dmg) {
    if (state.hp <= 0) return false;
    let actualDmg = dmg;
    if (state.armor > 0) {
      const absorbed = Math.min(state.armor, dmg * 0.5);
      state.armor -= absorbed;
      actualDmg = dmg - absorbed;
    }
    state.hp = Math.max(0, state.hp - actualDmg);
    return state.hp <= 0;
  }

  function reset(x = 0, z = 18) {
    state.position.set(x, 0, z);
    state.velocity.set(0, 0, 0);
    state.pitch = 0;
    state.yaw = 0;
    state.hp = 100;
    state.armor = 100;
    state.hasHelmet = true;
  }

  function groundSpeed() {
    return Math.hypot(state.velocity.x, state.velocity.z);
  }

  function resolveAxis(axis) {
    const halfY = state.height / 2;
    const p = state.position;
    for (const c of colliders) {
      const overlapX = p.x + RADIUS > c.minX && p.x - RADIUS < c.maxX;
      const overlapY = p.y + state.height > c.minY && p.y < c.maxY;
      const overlapZ = p.z + RADIUS > c.minZ && p.z - RADIUS < c.maxZ;

      if (overlapX && overlapY && overlapZ) {
        if (axis === 'x') {
          if (state.velocity.x > 0) p.x = c.minX - RADIUS;
          else if (state.velocity.x < 0) p.x = c.maxX + RADIUS;
          state.velocity.x = 0;
        } else if (axis === 'y') {
          if (state.velocity.y > 0) {
            p.y = c.minY - state.height;
            state.velocity.y = 0;
          } else {
            p.y = c.maxY;
            state.velocity.y = 0;
            state.grounded = true;
          }
        } else if (axis === 'z') {
          if (state.velocity.z > 0) p.z = c.minZ - RADIUS;
          else if (state.velocity.z < 0) p.z = c.maxZ + RADIUS;
          state.velocity.z = 0;
        }
      }
    }
  }

  function step(dt, keys) {
    // Recoil recovery
    const decay = Math.min(1, dt * 14);
    state.recoilPitch *= 1 - decay;
    state.recoilYaw *= 1 - decay;

    // Crouch handling
    const wantsCrouch = keys.has('ControlLeft') || keys.has('KeyC');
    state.crouching = wantsCrouch;
    const targetHeight = wantsCrouch ? CROUCH_HEIGHT : STAND_HEIGHT;
    const targetEye = wantsCrouch ? CROUCH_EYE : STAND_EYE;
    state.height += (targetHeight - state.height) * Math.min(1, dt * 16);
    state.eye += (targetEye - state.eye) * Math.min(1, dt * 16);

    // Desired movement direction
    let moveForward = 0;
    let moveRight = 0;
    if (keys.has('KeyW')) moveForward += 1;
    if (keys.has('KeyS')) moveForward -= 1;
    if (keys.has('KeyD')) moveRight += 1;
    if (keys.has('KeyA')) moveRight -= 1;

    const len = Math.hypot(moveForward, moveRight) || 1;
    const forwardX = -Math.sin(state.yaw);
    const forwardZ = -Math.cos(state.yaw);
    const rightX = -forwardZ;
    const rightZ = forwardX;

    const wishX = (forwardX * (moveForward / len) + rightX * (moveRight / len));
    const wishZ = (forwardZ * (moveForward / len) + rightZ * (moveRight / len));

    const maxSpeed = wantsCrouch ? MAX_GROUND_SPEED * 0.45 : MAX_GROUND_SPEED;

    if (state.grounded) {
      // Ground friction
      const speed = groundSpeed();
      if (speed > 0) {
        const drop = speed * FRICTION * dt;
        const newSpeed = Math.max(0, speed - drop);
        state.velocity.x *= newSpeed / speed;
        state.velocity.z *= newSpeed / speed;
      }

      // Ground acceleration
      if (moveForward !== 0 || moveRight !== 0) {
        state.velocity.x += wishX * ACCEL_GROUND * dt;
        state.velocity.z += wishZ * ACCEL_GROUND * dt;
        const postSpeed = groundSpeed();
        if (postSpeed > maxSpeed) {
          state.velocity.x = (state.velocity.x / postSpeed) * maxSpeed;
          state.velocity.z = (state.velocity.z / postSpeed) * maxSpeed;
        }
      }

      // Jump
      if (keys.has('Space')) {
        state.velocity.y = JUMP_VELOCITY;
        state.grounded = false;
      }
    } else {
      // Air acceleration & gravity
      state.velocity.x += wishX * ACCEL_AIR * dt;
      state.velocity.z += wishZ * ACCEL_AIR * dt;
      state.velocity.y -= GRAVITY * dt;
    }

    // Move & collide axis-by-axis
    state.position.x += state.velocity.x * dt;
    resolveAxis('x');

    state.grounded = false;
    state.position.y += state.velocity.y * dt;
    resolveAxis('y');

    state.position.z += state.velocity.z * dt;
    resolveAxis('z');

    // Bottom out plane check
    if (state.position.y < 0) {
      state.position.y = 0;
      state.velocity.y = 0;
      state.grounded = true;
    }
  }

  return {
    state,
    look,
    recoil,
    takeDamage,
    reset,
    step,
    groundSpeed
  };
}
