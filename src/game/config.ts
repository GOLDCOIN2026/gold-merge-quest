// =====================================================
// GOLD MERGE BOSS — Tunable game configuration
// =====================================================

export const GAME_CONFIG = {
  BOARD_SIZE: 6,

  // ---- Auto item generation (fixed cadence) ----
  // Every spawn fires 3.0s apart (1.5s under 2× Speed Boost).
  // The "cycle" concept is preserved purely for HUD display (1..36 → resets).
  AUTO_SPAWN_INTERVAL_MS: 3000,
  AUTO_SPAWN_CYCLE_LENGTH: 36,
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
  // Doubles spawn rate (3s → 1.5s) for 1 minute.
  // Up to 2 rewarded-ad uses/day, no free use.
  SPEED_BOOST_MULTIPLIER: 2,
  SPEED_BOOST_DURATION_MS: 60 * 1000,
  SPEED_BOOST_MAX_AD_USES_PER_DAY: 2,

  // Daily double-rewards booster (kept from previous build)
  DOUBLE_REWARDS_DURATION_MS: 10 * 60 * 1000,

  // ---- Refill system ----
  DAILY_REFILLS_MAX: 2,
  DAILY_AD_REFILLS: 2,
  REFILL_BATCH_LEVEL_1_PROB: 0.85,

  // ---- Daily login reward ----
  DAILY_REWARD_COINS: 250,

  // ---- Sell rewards (Gold Coin Tokens) ----
  // Only Levels 10/11/12 are sellable.
  SELL_TOKEN_REWARD_BY_LEVEL: {
    10: 10,
    11: 50,
    12: 100,
  } as Record<number, number>,

  // ---- Referral / share ----
  REFERRAL_BASE_URL: "https://goldcoinweb3.com/?ref=",
  CLAIM_URL: "https://goldcoinweb3.com/",
};

export type GameConfig = typeof GAME_CONFIG;

/**
 * Returns the delay (ms) before the next auto-spawn.
 * Fixed at 3.0s (1.5s under 2× Speed Boost — applied separately by the engine).
 * The `index` argument is kept for API compatibility but no longer affects timing.
 */
export function spawnIntervalForIndex(_index: number): number {
  return GAME_CONFIG.AUTO_SPAWN_INTERVAL_MS;
}
