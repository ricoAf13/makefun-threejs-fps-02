// Vanguard Protocol - Tactical DOM HUD & Radar Controller
import { PALETTE } from './palette.js';

export function createHud() {
  // DOM References
  const hudRoot = document.getElementById('hud');
  const ammoMagEl = document.getElementById('ammo-mag');
  const ammoReserveEl = document.getElementById('ammo-reserve');
  const weaponNameEl = document.getElementById('weapon-name');
  const hpValueEl = document.getElementById('hp-value');
  const hpBarEl = document.getElementById('hp-bar');
  const armorValueEl = document.getElementById('armor-value');
  const armorBarEl = document.getElementById('armor-bar');
  const cashValueEl = document.getElementById('cash-value');
  const roundTimerEl = document.getElementById('round-timer');
  const vanguardScoreEl = document.getElementById('score-vanguard');
  const syndicateScoreEl = document.getElementById('score-syndicate');
  const roundCounterEl = document.getElementById('round-counter');
  const crosshairEl = document.getElementById('crosshair');
  const hitmarkerEl = document.getElementById('hitmarker');
  const killfeedEl = document.getElementById('killfeed');
  const buyMenuEl = document.getElementById('buymenu');
  const bannerEl = document.getElementById('round-banner');
  const bannerTextEl = document.getElementById('banner-text');
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

  const overlayEl = document.getElementById('overlay');
  const overlayTitleEl = document.getElementById('overlay-title');
  const overlayCopyEl = document.getElementById('overlay-copy');
  const playBtn = document.getElementById('play');

  let playCallback = null;
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (playCallback) playCallback();
    });
  }

  function setVitals(hp, armor) {
    if (hpValueEl) hpValueEl.textContent = Math.max(0, Math.round(hp));
    if (hpBarEl) hpBarEl.style.width = `${Math.max(0, Math.min(100, hp))}%`;
    if (armorValueEl) armorValueEl.textContent = Math.max(0, Math.round(armor));
    if (armorBarEl) armorBarEl.style.width = `${Math.max(0, Math.min(100, armor))}%`;
  }

  function setWeapon(name, mag, reserve) {
    if (weaponNameEl) weaponNameEl.textContent = name;
    if (ammoMagEl) ammoMagEl.textContent = mag;
    if (ammoReserveEl) ammoReserveEl.textContent = `/ ${reserve}`;
  }

  function setEconomy(cash) {
    if (cashValueEl) cashValueEl.textContent = `$${cash.toLocaleString()}`;
  }

  function setRoundInfo(round, maxRounds, vScore, sScore, secondsLeft) {
    if (roundCounterEl) roundCounterEl.textContent = `ROUND ${round} / ${maxRounds}`;
    if (vanguardScoreEl) vanguardScoreEl.textContent = vScore;
    if (syndicateScoreEl) syndicateScoreEl.textContent = sScore;

    const mins = Math.floor(secondsLeft / 60);
    const secs = Math.floor(secondsLeft % 60);
    if (roundTimerEl) {
      roundTimerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      roundTimerEl.style.color = secondsLeft < 15 ? PALETTE.dangerRed : PALETTE.ink;
    }
  }

  function hitMarker(headshot = false, durationMs = 120) {
    if (!hitmarkerEl) return;
    hitmarkerEl.classList.add('on');
    if (headshot) hitmarkerEl.classList.add('headshot');
    else hitmarkerEl.classList.remove('headshot');

    setTimeout(() => {
      hitmarkerEl.classList.remove('on');
      hitmarkerEl.classList.remove('headshot');
    }, durationMs);
  }

  function addKillNotice(killer, weapon, victim, isHeadshot) {
    if (!killfeedEl) return;
    const item = document.createElement('div');
    item.className = 'kill-item';
    item.innerHTML = `<span class="killer">${killer}</span> <span class="wpn">[${weapon}]</span> ${isHeadshot ? '<span class="hs">⚡HEADSHOT</span>' : ''} <span class="victim">${victim}</span>`;
    killfeedEl.appendChild(item);
    setTimeout(() => {
      item.classList.add('fade-out');
      setTimeout(() => item.remove(), 400);
    }, 3800);
  }

  function showBanner(text, subtext = '', durationMs = 3000) {
    if (!bannerEl || !bannerTextEl) return;
    bannerTextEl.innerHTML = `${text}<br><span style="font-size:16px;font-weight:400;color:${PALETTE.muted}">${subtext}</span>`;
    bannerEl.classList.add('active');
    setTimeout(() => {
      bannerEl.classList.remove('active');
    }, durationMs);
  }

  function toggleBuyMenu(visible) {
    if (!buyMenuEl) return;
    if (visible) buyMenuEl.removeAttribute('hidden');
    else buyMenuEl.setAttribute('hidden', '');
  }

  function updateCrosshairSpread(spreadVal) {
    if (!crosshairEl) return;
    const gap = Math.round(6 + spreadVal * 400);
    crosshairEl.style.setProperty('--gap', `${gap}px`);
  }

  function renderRadar(playerPos, playerYaw, bots, sites) {
    if (!radarCtx || !radarCanvas) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 2.2; // pixels per world meter

    radarCtx.clearRect(0, 0, w, h);

    // Radar background grid
    radarCtx.fillStyle = 'rgba(12, 14, 18, 0.85)';
    radarCtx.fillRect(0, 0, w, h);
    radarCtx.strokeStyle = 'rgba(40, 50, 67, 0.6)';
    radarCtx.lineWidth = 1;
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    radarCtx.stroke();
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, cx * 0.5, 0, Math.PI * 2);
    radarCtx.stroke();

    // Map sites relative to player
    if (sites) {
      Object.keys(sites).forEach((key) => {
        const pt = sites[key];
        const dx = (pt.x - playerPos.x) * scale;
        const dz = (pt.z - playerPos.z) * scale;
        if (Math.hypot(dx, dz) < cx - 6) {
          radarCtx.fillStyle = key === 'siteA' ? PALETTE.siteA : PALETTE.siteB;
          radarCtx.font = 'bold 10px monospace';
          radarCtx.fillText(key === 'siteA' ? 'A' : 'B', cx + dx - 3, cy + dz + 4);
        }
      });
    }

    // Bots (Red blips)
    if (bots) {
      bots.forEach((bot) => {
        if (!bot.alive) return;
        const bPos = bot.group.position;
        const dx = (bPos.x - playerPos.x) * scale;
        const dz = (bPos.z - playerPos.z) * scale;
        if (Math.hypot(dx, dz) < cx - 4) {
          radarCtx.fillStyle = PALETTE.dangerRed;
          radarCtx.beginPath();
          radarCtx.arc(cx + dx, cy + dz, 3.5, 0, Math.PI * 2);
          radarCtx.fill();
        }
      });
    }

    // Player arrow (Center)
    radarCtx.save();
    radarCtx.translate(cx, cy);
    radarCtx.rotate(-playerYaw);
    radarCtx.fillStyle = PALETTE.vanguardLight;
    radarCtx.beginPath();
    radarCtx.moveTo(0, -6);
    radarCtx.lineTo(4, 5);
    radarCtx.lineTo(0, 3);
    radarCtx.lineTo(-4, 5);
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.restore();
  }

  function showOverlay(mode, finalScore = 0) {
    if (!overlayEl) return;
    overlayEl.removeAttribute('hidden');
    if (mode === 'start') {
      overlayTitleEl.textContent = 'Vanguard Protocol: Sector Zero';
      overlayCopyEl.textContent = 'Tactical round-based shooter. Eliminate the Syndicate breach unit or protect the Neural Cores.';
      if (playBtn) playBtn.textContent = 'Deploy Operator';
    } else if (mode === 'paused') {
      overlayTitleEl.textContent = 'Mission Suspended';
      overlayCopyEl.textContent = 'Click Deploy to re-engage tactical field command.';
      if (playBtn) playBtn.textContent = 'Resume Mission';
    } else if (mode === 'end') {
      overlayTitleEl.textContent = 'Operation Concluded';
      overlayCopyEl.textContent = `Combat Score: ${finalScore} pts. Objective secured.`;
      if (playBtn) playBtn.textContent = 'Replay Protocol';
    }
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.setAttribute('hidden', '');
  }

  return {
    setVitals,
    setWeapon,
    setEconomy,
    setRoundInfo,
    hitMarker,
    addKillNotice,
    showBanner,
    toggleBuyMenu,
    updateCrosshairSpread,
    renderRadar,
    showOverlay,
    hideOverlay,
    onPlay: (fn) => { playCallback = fn; }
  };
}
