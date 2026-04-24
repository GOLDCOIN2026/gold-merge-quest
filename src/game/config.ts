// =====================================================
// GOLD MERGE BOSS — Tunable game configuration
// All economy values configurable via JS variables.
// =====================================================

export const GAME_CONFIG = {
  BOARD_SIZE: 6,

  // ---- Auto item generation (progressive schedule) ----
  // 1st spawn after 10s, 2nd after +15s, 3rd after +20s, +5s each subsequent
  AUTO_SPAWN_FIRST_DELAY_MS: 10_000,
  AUTO_SPAWN_STEP_MS: 5_000,
  AUTO_SPAWN_MAX_INTERVAL_MS: 60_000, // hard cap so it doesn't get absurd
  AUTO_SPAWN_MAX_LEVEL: 2,

  // Generator button (manual)
  GENERATOR_COST_COINS: 0,
  GENERATOR_COOLDOWN_MS: 800,

  // Combo system
  COMBO_WINDOW_MS: 2500,
  COMBO_MAX_MULT: 5,

  // XP / level
  XP_PER_MERGE: (level: number) => level * 5,
  XP_TO_NEXT: (lvl: number) => Math.round(80 * Math.pow(1.35, lvl - 1)),

  // Daily cap
  DAILY_COIN_CAP: 5000,

  // Boosters — duration & multipliers
  DOUBLE_REWARDS_DURATION_MS: 10 * 60 * 1000, // 10 minutes
  SPEED_BOOST_MULTIPLIER: 2,                  // doubles spawn speed
  SPEED_BOOST_DURATION_MS: 10 * 60 * 1000,    // 10 minutes

  // Daily reward (coins)
  DAILY_REWARD_COINS: 250,

  // Selling — Golden Crown (level 7) → Gold Coins
  SELL_REWARD_BY_LEVEL: { 7: 1 } as Record<number, number>,
};

export type GameConfig = typeof GAME_CONFIG;

/**
 * Returns the delay (ms) before the Nth automatic spawn:
 *   index 0 → 10s, 1 → 15s, 2 → 20s, 3 → 25s, +5s each subsequent.
 */
export function spawnIntervalForIndex(index: number): number {
  const ms =
    GAME_CONFIG.AUTO_SPAWN_FIRST_DELAY_MS + index * GAME_CONFIG.AUTO_SPAWN_STEP_MS;
  return Math.min(ms, GAME_CONFIG.AUTO_SPAWN_MAX_INTERVAL_MS);
}
