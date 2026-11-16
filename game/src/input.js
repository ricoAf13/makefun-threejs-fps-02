// Vanguard Protocol - Keyboard & Pointer Lock Input Manager

export function createInput(canvas, onLockChange) {
  const keys = new Set();
  const state = {
    keys,
    locked: false,
    firing: false
  };

  let lookDeltaX = 0;
  let lookDeltaY = 0;

  function onMouseDown(e) {
    if (e.button === 0 && state.locked) {
      state.firing = true;
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) {
      state.firing = false;
    }
  }

  function onMouseMove(e) {
    if (state.locked) {
      lookDeltaX += e.movementX || 0;
      lookDeltaY += e.movementY || 0;
    }
  }

  function onKeyDown(e) {
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onPointerLock() {
    state.locked = document.pointerLockElement === canvas;
    if (!state.locked) {
      state.firing = false;
    }
    if (onLockChange) onLockChange(state.locked);
  }

  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('pointerlockchange', onPointerLock);

  function requestLock() {
    canvas.requestPointerLock().catch(() => {});
  }

  function exitLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function takeLook() {
    const x = lookDeltaX;
    const y = lookDeltaY;
    lookDeltaX = 0;
    lookDeltaY = 0;
    return { x, y };
  }

  return {
    state,
    requestLock,
    exitLock,
    takeLook
  };
}
