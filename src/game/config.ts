// =====================================================
// GOLD MERGE BOSS — Tunable game configuration
// =====================================================

export const GAME_CONFIG = {
  BOARD_SIZE: 6,

  // ---- Auto item generation (progressive cycle) ----
  // Cycle of 36 spawns completes in EXACTLY 10 minutes (600s).
  // Spawns 1-30 hold near-constant ~5.0s pacing (slight 0.01s drift for "alive" feel).
  // Spawns 31-36 ramp up to balance the cycle while keeping the 10-minute total.
  AUTO_SPAWN_CYCLE_LENGTH: 36, // resets after this many spawns
  AUTO_SPAWN_MAX_LEVEL: 2,     // newly spawned tiles are level 1 or 2

  // Combo system
  COMBO_WINDOW_MS: 2500,
  COMBO_MAX_MULT: 5,

  // XP / level
  XP_PER_MERGE: (level: number) => level * 5,
  XP_TO_NEXT: (lvl: number) => Math.round(80 * Math.pow(1.32, lvl - 1)),

  // Daily Coin earnings cap (coins, separate from sell tokens)
  DAILY_COIN_CAP: 5000,

  // ---- Speed Boost ----
  // Doubles spawn rate (halves intervals) for 2 minutes.
  // 1 free use/day + up to 3 rewarded-ad uses/day.
  SPEED_BOOST_MULTIPLIER: 2,
  SPEED_BOOST_DURATION_MS: 2 * 60 * 1000,
  SPEED_BOOST_MAX_AD_USES_PER_DAY: 3,

  // Daily double-rewards booster (kept from previous build)
  DOUBLE_REWARDS_DURATION_MS: 10 * 60 * 1000,

  // ---- Refill system ----
  DAILY_AD_REFILLS: 2,         // first 2 refills/day via ads (before referral tier)
  REFILL_BATCH_LEVEL_1_PROB: 0.85, // probability a refilled tile is level 1 vs 2

  // ---- Daily login reward ----
  DAILY_REWARD_COINS: 250,

  // ---- Sell rewards (Gold Coin Tokens) ----
  // Levels 1-5 are not sellable.
  SELL_TOKEN_REWARD_BY_LEVEL: {
    6: 10,
    7: 15,
    8: 30,
    9: 50,
    10: 100,
  } as Record<number, number>,

  // ---- Referral / share ----
  REFERRAL_BASE_URL: "https://goldcoinweb3.com/?ref=",
  CLAIM_URL: "https://goldcoinweb3.com/",
};

export type GameConfig = typeof GAME_CONFIG;

/**
 * Returns the delay (ms) before the Nth auto-spawn within the current cycle.
 *
 * Smooth linear progression across a 36-spawn cycle:
 *   - Spawn 1  → 5.0s
 *   - Spawn 36 → 20.0s
 *   - Each step grows by 15s / 35 ≈ 0.4286s
 *
 * Total cycle duration ≈ 36·(5+20)/2 = 450,000 ms = 7m 30s ✓
 * After index 35 the engine resets the cycle counter to 0 (back to 5.0s).
 */
export function spawnIntervalForIndex(index: number): number {
  const cycleLen = GAME_CONFIG.AUTO_SPAWN_CYCLE_LENGTH;
  const within = index % cycleLen;
  const startMs = 5000;
  const endMs = 20000;
  const t = cycleLen <= 1 ? 0 : within / (cycleLen - 1);
  return Math.round(startMs + (endMs - startMs) * t);
}
