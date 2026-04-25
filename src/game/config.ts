// =====================================================
// GOLD MERGE BOSS — Tunable game configuration
// =====================================================

export const GAME_CONFIG = {
  BOARD_SIZE: 6,

  // ---- Auto item generation (progressive cycle) ----
  // 1st spawn: 5s, 2nd: 6s, 3rd: 7s, ... 36th: 40s, then resets to 5s.
  AUTO_SPAWN_FIRST_DELAY_MS: 5_000,
  AUTO_SPAWN_STEP_MS: 1_000,
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
  SPEED_BOOST_MULTIPLIER: 2,
  SPEED_BOOST_DURATION_MS: 2 * 60 * 1000,

  // Daily double-rewards booster (kept from previous build)
  DOUBLE_REWARDS_DURATION_MS: 10 * 60 * 1000,

  // ---- Refill system ----
  DAILY_AD_REFILLS: 2,         // first 2 refills/day via ads
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
};

export type GameConfig = typeof GAME_CONFIG;

/**
 * Returns the delay (ms) before the Nth auto-spawn within the current cycle.
 *   index 0 → 5s, 1 → 6s, ..., 35 → 40s. After index 35 the engine resets
 *   the cycle counter to 0, restarting at 5s.
 */
export function spawnIntervalForIndex(index: number): number {
  const within = index % GAME_CONFIG.AUTO_SPAWN_CYCLE_LENGTH;
  return GAME_CONFIG.AUTO_SPAWN_FIRST_DELAY_MS + within * GAME_CONFIG.AUTO_SPAWN_STEP_MS;
}
