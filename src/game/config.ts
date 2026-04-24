// =====================================================
// GOLD MERGE BOSS — Tunable game configuration
// All economy values configurable via JS variables.
// =====================================================

export const GAME_CONFIG = {
  BOARD_SIZE: 6,

  // Auto item generation
  AUTO_SPAWN_INTERVAL_MS: 6000, // every N ms a new lvl-1 item drops
  AUTO_SPAWN_MAX_LEVEL: 2,      // can spawn up to this level

  // Generator button
  GENERATOR_COST_COINS: 0,      // free spawn baseline (set >0 to monetize)
  GENERATOR_COOLDOWN_MS: 800,

  // Combo system
  COMBO_WINDOW_MS: 2500,
  COMBO_MAX_MULT: 5,            // up to 5x

  // XP / level
  XP_PER_MERGE: (level: number) => level * 5,
  XP_TO_NEXT: (lvl: number) => Math.round(80 * Math.pow(1.35, lvl - 1)),

  // Daily cap
  DAILY_COIN_CAP: 5000,

  // Double rewards (rewarded ad)
  DOUBLE_REWARDS_DURATION_MS: 10 * 60 * 1000,

  // Speed boost (rewarded ad)
  SPEED_BOOST_MULTIPLIER: 3,
  SPEED_BOOST_DURATION_MS: 60 * 1000,

  // Daily reward (coins)
  DAILY_REWARD_COINS: 250,
};

export type GameConfig = typeof GAME_CONFIG;
