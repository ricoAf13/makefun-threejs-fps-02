// Vanguard Protocol - Tactical Economy & Buy System
import { SoundEngine } from './sound.js';

export function createEconomy() {
  let cash = 800;
  let lossStreak = 0;

  function canAfford(price) {
    return cash >= price;
  }

  function spend(price) {
    if (cash >= price) {
      cash -= price;
      SoundEngine.playBuy();
      return true;
    }
    return false;
  }

  function addKillReward() {
    cash = Math.min(16000, cash + 300);
  }

  function addRoundReward(won) {
    if (won) {
      lossStreak = 0;
      cash = Math.min(16000, cash + 3250);
    } else {
      lossStreak = Math.min(4, lossStreak + 1);
      const lossBonus = 1400 + lossStreak * 500;
      cash = Math.min(16000, cash + lossBonus);
    }
  }

  function reset() {
    cash = 800;
    lossStreak = 0;
  }

  return {
    get cash() {
      return cash;
    },
    canAfford,
    spend,
    addKillReward,
    addRoundReward,
    reset
  };
}
