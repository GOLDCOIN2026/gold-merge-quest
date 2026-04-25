// =====================================================
// GOLD MERGE BOSS — Core game store
// Pure React state via useSyncExternalStore. No deps.
// =====================================================

import { useSyncExternalStore } from "react";
import { GAME_CONFIG, spawnIntervalForIndex } from "./config";
import {
  CATEGORY_IDS,
  CATEGORY_ITEMS,
  ITEMS,
  MAX_LEVEL,
  getItem,
  type CategoryId,
  type ItemDef,
} from "./items";
import {
  rewardCoins as bridgeReward,
  saveGameData,
  loadGameData,
  getReferralCount,
} from "./bridge";
import { SFX } from "./sound";

// -------------------- types --------------------
export type CellId = number; // 0 .. BOARD_SIZE^2 - 1
export type GamePhase = "menu" | "playing" | "paused";

export interface Tile {
  id: string;
  category: CategoryId;
  level: number;
  bornAt: number;
}

export interface FloatText {
  id: string;
  cell: CellId;
  text: string;
  variant: "coin" | "combo" | "xp" | "token";
}

export interface Mission {
  id: string;
  description: string;
  kind: "merge" | "create";
  category: CategoryId;
  level: number;
  target: number;
  progress: number;
  reward: number;
  done: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface BannerMsg {
  id: string;
  title: string;
  subtitle?: string;
  variant: "achievement" | "level" | "reward" | "combo";
}

/** Tracks whether each per-day free use is still available. */
export interface DailyFreeUses {
  speedBoost: boolean;
}

export interface GameState {
  // Flow control
  phase: GamePhase;

  board: (Tile | null)[];

  // Currencies — Coins (in-game economy) vs Tokens (sell rewards → host wallet)
  coins: number;
  tokens: number;
  totalCoinsEarnedToday: number;
  todayKey: string;
  lastDailyClaimKey: string | null;

  xp: number;
  level: number;

  combo: number;
  comboMult: number;
  lastMergeAt: number;

  missions: Mission[];
  achievements: Achievement[];
  unlockedMaxLevelByCategory: Record<CategoryId, number>;

  floats: FloatText[];
  banners: BannerMsg[];
  particles: { id: string; cell: CellId; level: number; category: CategoryId }[];

  // Boosters
  doubleRewardsUntil: number;
  speedBoostUntil: number;
  /** Daily-reset free uses (e.g. one free Speed Boost per day). */
  dailyFreeUses: DailyFreeUses;

  // ---- Refill system ----
  /** Number of ad-based refills used today (resets at midnight). */
  refillsUsedToday: number;
  /** Permanent referral-earned refill credits. */
  referralRefillCredits: number;
  /** Last referral count we awarded credits for (to detect new referrals). */
  lastReferralCountSeen: number;

  // Selection (used for Sell action)
  selectedCell: CellId | null;

  // Tutorial
  tutorialStep: number; // 0 = not started, -1 = done

  muted: boolean;

  // Auto-spawn scheduling
  spawnIndex: number;       // count within current cycle (0..AUTO_SPAWN_CYCLE_LENGTH-1)
  nextSpawnAt: number;      // wall-clock ms when next auto-spawn fires
  /** Display total of spawns this run (for HUD: "12 / 36"). */
  cyclePosition: number;
}

// -------------------- helpers --------------------
const SIZE = GAME_CONFIG.BOARD_SIZE;
const CELLS = SIZE * SIZE;
const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);

/** Pick a category at random, weighted equally. */
function randomCategory(): CategoryId {
  return CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
}

function makeMissions(playerLevel: number): Mission[] {
  const tier = Math.min(MAX_LEVEL - 1, 2 + Math.floor(playerLevel / 3));
  const cats: CategoryId[] = [randomCategory(), randomCategory(), randomCategory()];
  return [
    {
      id: uid(),
      description: `Merge ${10 + playerLevel * 2} ${getItem(cats[0], 2).name}s`,
      kind: "merge", category: cats[0], level: 2,
      target: 10 + playerLevel * 2, progress: 0,
      reward: 80 + playerLevel * 20, done: false, claimed: false,
    },
    {
      id: uid(),
      description: `Create 3 ${getItem(cats[1], Math.min(4, tier)).name}s`,
      kind: "create", category: cats[1], level: Math.min(4, tier),
      target: 3, progress: 0,
      reward: 150 + playerLevel * 30, done: false, claimed: false,
    },
    {
      id: uid(),
      description: `Create 1 ${getItem(cats[2], Math.min(MAX_LEVEL, tier + 1)).name}`,
      kind: "create", category: cats[2], level: Math.min(MAX_LEVEL, tier + 1),
      target: 1, progress: 0,
      reward: 300 + playerLevel * 40, done: false, claimed: false,
    },
  ];
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first_merge",  name: "First Merge!",     description: "Perform your first merge", unlocked: false },
  { id: "combo_3",      name: "On Fire",          description: "Reach a 3× combo", unlocked: false },
  { id: "combo_5",      name: "Unstoppable",      description: "Reach a 5× combo", unlocked: false },
  { id: "all_categories", name: "Collector",      description: "Merge in all 3 categories", unlocked: false },
  { id: "create_l5",    name: "Refined",          description: "Create any Level 5 item", unlocked: false },
  { id: "create_l7",    name: "Master Merger",    description: "Create any Level 7 item", unlocked: false },
  { id: "create_l10",   name: "Legend",           description: "Create any Level 10 item", unlocked: false },
  { id: "level_5",      name: "Apprentice",       description: "Reach player level 5", unlocked: false },
  { id: "level_10",     name: "Expert Merger",    description: "Reach player level 10", unlocked: false },
  { id: "earn_1000",    name: "Wealthy",          description: "Earn 1,000 coins", unlocked: false },
  { id: "first_sell",   name: "First Sale",       description: "Sell your first high-tier item for tokens", unlocked: false },
];

function emptyBoard(): (Tile | null)[] {
  return Array.from({ length: CELLS }, () => null);
}

function seedBoard(): (Tile | null)[] {
  const b = emptyBoard();
  // 6 starter tiles spread across categories, levels 1-2.
  const positions = [7, 9, 14, 16, 21, 28];
  positions.forEach((p, i) => {
    b[p] = {
      id: uid(),
      category: CATEGORY_IDS[i % CATEGORY_IDS.length],
      level: i < 4 ? 1 : 2,
      bornAt: Date.now(),
    };
  });
  return b;
}

function freshDailyFreeUses(): DailyFreeUses {
  return { speedBoost: true };
}

function defaultUnlocked(): Record<CategoryId, number> {
  return { relics: 1, blockchain: 1, treasure: 1 };
}

function defaultState(): GameState {
  return {
    phase: "menu",
    board: seedBoard(),
    coins: 0,
    tokens: 0,
    totalCoinsEarnedToday: 0,
    todayKey: todayKey(),
    lastDailyClaimKey: null,
    xp: 0,
    level: 1,
    combo: 0,
    comboMult: 1,
    lastMergeAt: 0,
    missions: makeMissions(1),
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
    unlockedMaxLevelByCategory: defaultUnlocked(),
    floats: [],
    banners: [],
    particles: [],
    doubleRewardsUntil: 0,
    speedBoostUntil: 0,
    dailyFreeUses: freshDailyFreeUses(),
    refillsUsedToday: 0,
    referralRefillCredits: 0,
    lastReferralCountSeen: 0,
    selectedCell: null,
    tutorialStep: 0,
    muted: false,
    spawnIndex: 0,
    nextSpawnAt: 0,
    cyclePosition: 0,
  };
}

// -------------------- store --------------------
let state: GameState = defaultState();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());
const set = (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
  const next = typeof partial === "function" ? partial(state) : partial;
  state = { ...state, ...next };
  notify();
};
const getState = () => state;

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(state),
    () => selector(state),
  );
}

// -------------------- persistence --------------------
interface SaveBlob {
  board: GameState["board"];
  coins: number; tokens: number;
  totalCoinsEarnedToday: number; todayKey: string;
  lastDailyClaimKey: string | null;
  xp: number; level: number;
  missions: Mission[];
  achievements: Achievement[];
  unlockedMaxLevelByCategory: Record<CategoryId, number>;
  doubleRewardsUntil: number;
  speedBoostUntil: number;
  dailyFreeUses: DailyFreeUses;
  refillsUsedToday: number;
  referralRefillCredits: number;
  lastReferralCountSeen: number;
  spawnIndex: number;
  nextSpawnAt: number;
  cyclePosition: number;
  tutorialStep: number;
  muted: boolean;
  /** Wall-clock ms when game was last saved. Used to recover spawn schedule. */
  savedAt: number;
}

function persist() {
  const s = state;
  const blob: SaveBlob = {
    board: s.board,
    coins: s.coins, tokens: s.tokens,
    totalCoinsEarnedToday: s.totalCoinsEarnedToday, todayKey: s.todayKey,
    lastDailyClaimKey: s.lastDailyClaimKey,
    xp: s.xp, level: s.level,
    missions: s.missions, achievements: s.achievements,
    unlockedMaxLevelByCategory: s.unlockedMaxLevelByCategory,
    doubleRewardsUntil: s.doubleRewardsUntil,
    speedBoostUntil: s.speedBoostUntil,
    dailyFreeUses: s.dailyFreeUses,
    refillsUsedToday: s.refillsUsedToday,
    referralRefillCredits: s.referralRefillCredits,
    lastReferralCountSeen: s.lastReferralCountSeen,
    spawnIndex: s.spawnIndex,
    nextSpawnAt: s.nextSpawnAt,
    cyclePosition: s.cyclePosition,
    tutorialStep: s.tutorialStep, muted: s.muted,
    savedAt: Date.now(),
  };
  saveGameData(blob);
}

let saveTimer: number | null = null;
function schedulePersist() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(persist, 400);
}

/** Force an immediate save. */
export function persistNow() {
  if (saveTimer) { window.clearTimeout(saveTimer); saveTimer = null; }
  persist();
}

export function loadFromStorage() {
  const blob = loadGameData<SaveBlob>();
  if (!blob) {
    // First run — still sync referral baseline.
    syncReferralCredits();
    return;
  }
  const today = todayKey();
  const isNewDay = blob.todayKey !== today;

  // Validate board shape — drop legacy single-category saves.
  const validBoard = Array.isArray(blob.board) && blob.board.length === CELLS
    && blob.board.every(t => t == null || (typeof t === "object" && "category" in t));

  set({
    ...blob,
    board: validBoard ? blob.board : seedBoard(),
    // Always boot to the main menu — game must NOT auto-start.
    phase: "menu",
    totalCoinsEarnedToday: isNewDay ? 0 : blob.totalCoinsEarnedToday,
    todayKey: today,
    floats: [], banners: [], particles: [],
    combo: 0, comboMult: 1, lastMergeAt: 0,
    selectedCell: null,
    // Reset daily-reset things at day rollover
    refillsUsedToday: isNewDay ? 0 : blob.refillsUsedToday,
    dailyFreeUses: isNewDay ? freshDailyFreeUses() : blob.dailyFreeUses,
    // Spawn schedule resets when the player starts the game from the menu.
    spawnIndex: 0,
    nextSpawnAt: 0,
    cyclePosition: blob.cyclePosition ?? 0,
    unlockedMaxLevelByCategory: blob.unlockedMaxLevelByCategory ?? defaultUnlocked(),
  });

  syncReferralCredits();
}

/**
 * Award refill credits for any new referrals since last sync.
 * Called on boot and on visibility change.
 */
export function syncReferralCredits() {
  const current = getReferralCount();
  if (current > state.lastReferralCountSeen) {
    const delta = current - state.lastReferralCountSeen;
    set(s => ({
      referralRefillCredits: s.referralRefillCredits + delta,
      lastReferralCountSeen: current,
    }));
    if (delta > 0) {
      pushBanner({
        title: "New Referrals!",
        subtitle: `+${delta} refill credit${delta === 1 ? "" : "s"}`,
        variant: "reward",
      });
    }
    schedulePersist();
  } else if (current < state.lastReferralCountSeen) {
    // Bridge changed — re-baseline silently.
    set({ lastReferralCountSeen: current });
  }
}

// -------------------- flow control --------------------
export function startGame() {
  const now = Date.now();
  set({
    phase: "playing",
    spawnIndex: 0,
    cyclePosition: 0,
    nextSpawnAt: now + spawnIntervalForIndex(0),
    selectedCell: null,
  });
  SFX.reward();
}

export function pauseGame() {
  if (state.phase !== "playing") return;
  const remaining = Math.max(0, state.nextSpawnAt - Date.now());
  set({ phase: "paused", nextSpawnAt: -remaining }); // negative = remaining ms
  SFX.pickup();
  schedulePersist();
}

export function resumeGame() {
  if (state.phase !== "paused") return;
  const remaining = Math.max(0, -state.nextSpawnAt);
  set({ phase: "playing", nextSpawnAt: Date.now() + remaining });
  SFX.drop();
}

export function quitToMenu() {
  persistNow();
  set({
    phase: "menu",
    selectedCell: null,
    combo: 0, comboMult: 1,
    spawnIndex: 0, nextSpawnAt: 0, cyclePosition: 0,
  });
  SFX.pickup();
}

// -------------------- effects --------------------
function pushFloat(cell: CellId, text: string, variant: FloatText["variant"]) {
  const f: FloatText = { id: uid(), cell, text, variant };
  set(s => ({ floats: [...s.floats, f] }));
  window.setTimeout(() => set(s => ({ floats: s.floats.filter(x => x.id !== f.id) })), 1200);
}

function pushParticles(cell: CellId, level: number, category: CategoryId) {
  const p = { id: uid(), cell, level, category };
  set(s => ({ particles: [...s.particles, p] }));
  window.setTimeout(() => set(s => ({ particles: s.particles.filter(x => x.id !== p.id) })), 900);
}

function pushBanner(b: Omit<BannerMsg, "id">) {
  const banner: BannerMsg = { ...b, id: uid() };
  set(s => ({ banners: [...s.banners, banner] }));
  window.setTimeout(() => set(s => ({ banners: s.banners.filter(x => x.id !== banner.id) })), 2600);
}

function unlockAchievement(id: string) {
  const a = state.achievements.find(x => x.id === id);
  if (!a || a.unlocked) return;
  set(s => ({ achievements: s.achievements.map(x => x.id === id ? { ...x, unlocked: true } : x) }));
  pushBanner({ title: "Achievement Unlocked!", subtitle: a.name, variant: "achievement" });
  schedulePersist();
}

function awardCoins(amount: number, cell: CellId | null) {
  if (amount <= 0) return;
  const now = Date.now();
  const today = todayKey();
  const mult = state.doubleRewardsUntil > now ? 2 : 1;
  let final = Math.round(amount * mult);
  const remaining = Math.max(0, GAME_CONFIG.DAILY_COIN_CAP - state.totalCoinsEarnedToday);
  final = Math.min(final, remaining);
  if (final <= 0) return;

  set(s => ({
    coins: s.coins + final,
    totalCoinsEarnedToday: (s.todayKey === today ? s.totalCoinsEarnedToday : 0) + final,
    todayKey: today,
  }));
  // Coins are in-game; we don't push them to the host wallet here.
  if (cell != null) pushFloat(cell, `+${final}`, "coin");
  if (state.coins >= 1000) unlockAchievement("earn_1000");
}

/** Award Gold Coin Tokens (sell currency). Tokens are sent to the host wallet. */
function awardTokens(amount: number, cell: CellId | null) {
  if (amount <= 0) return;
  set(s => ({ tokens: s.tokens + amount }));
  bridgeReward(amount);
  if (cell != null) pushFloat(cell, `+${amount} 🪙`, "token");
}

function gainXP(amount: number) {
  let { xp, level } = state;
  xp += amount;
  let leveled = false;
  while (xp >= GAME_CONFIG.XP_TO_NEXT(level)) {
    xp -= GAME_CONFIG.XP_TO_NEXT(level);
    level += 1;
    leveled = true;
  }
  set({ xp, level });
  if (leveled) {
    SFX.levelUp();
    pushBanner({ title: `Level ${level}!`, subtitle: "New rewards unlocked", variant: "level" });
    if (level >= 5) unlockAchievement("level_5");
    if (level >= 10) unlockAchievement("level_10");
    if (level % 3 === 0) set({ missions: makeMissions(level) });
  }
}

function bumpCombo() {
  const now = Date.now();
  const within = now - state.lastMergeAt < GAME_CONFIG.COMBO_WINDOW_MS;
  const combo = within ? state.combo + 1 : 1;
  const mult = Math.min(GAME_CONFIG.COMBO_MAX_MULT, 1 + Math.floor(combo / 3));
  set({ combo, comboMult: mult, lastMergeAt: now });
  if (combo === 3) { unlockAchievement("combo_3"); pushBanner({ title: "Combo ×3!", variant: "combo" }); }
  if (combo === 5) { unlockAchievement("combo_5"); pushBanner({ title: "Combo ×5!", variant: "combo" }); }
}

function trackMission(kind: "merge" | "create", category: CategoryId, level: number) {
  const missions = state.missions.map(m => {
    if (m.done || m.kind !== kind || m.category !== category || m.level !== level) return m;
    const progress = Math.min(m.target, m.progress + 1);
    return { ...m, progress, done: progress >= m.target };
  });
  set({ missions });
}

/** Track that the player has merged something in this category (for "Collector" achievement). */
const _mergedCategories = new Set<CategoryId>();
function trackCategoryMerge(category: CategoryId) {
  _mergedCategories.add(category);
  if (_mergedCategories.size === CATEGORY_IDS.length) {
    unlockAchievement("all_categories");
  }
}

// -------------------- selection / tap --------------------
export function selectCell(cell: CellId | null) {
  if (cell == null) { set({ selectedCell: null }); return; }
  const tile = state.board[cell];
  if (!tile) { set({ selectedCell: null }); return; }
  set({ selectedCell: state.selectedCell === cell ? null : cell });
}

/**
 * Sell the currently selected tile if it is sellable
 * (defined in GAME_CONFIG.SELL_TOKEN_REWARD_BY_LEVEL — Levels 6-10).
 */
export function sellSelected(): boolean {
  const cell = state.selectedCell;
  if (cell == null) return false;
  const tile = state.board[cell];
  if (!tile) return false;
  const reward = GAME_CONFIG.SELL_TOKEN_REWARD_BY_LEVEL[tile.level];
  if (!reward) return false;

  // Visual flourish on the cell
  pushParticles(cell, tile.level, tile.category);
  pushFloat(cell, `+${reward} 🪙`, "token");

  const board = state.board.slice();
  board[cell] = null;
  set({ board, selectedCell: null });

  awardTokens(reward, cell);
  SFX.sell();
  unlockAchievement("first_sell");
  pushBanner({
    title: "Sold!",
    subtitle: `+${reward} Gold Coin Token${reward === 1 ? "" : "s"}`,
    variant: "reward",
  });
  schedulePersist();
  return true;
}

// -------------------- merge / drop --------------------
/** Drop tile from `from` onto `to`. Returns true if anything happened. */
export function dropTile(from: CellId, to: CellId): boolean {
  if (from === to) return false;
  const a = state.board[from];
  const b = state.board[to];
  if (!a) return false;

  if (!b) {
    const board = state.board.slice();
    board[to] = a;
    board[from] = null;
    set({ board });
    SFX.drop();
    schedulePersist();
    return true;
  }

  // Different category, different level, or already at max → swap.
  const canMerge = a.category === b.category && a.level === b.level && a.level < MAX_LEVEL;
  if (!canMerge) {
    const board = state.board.slice();
    board[to] = a;
    board[from] = b;
    set({ board });
    SFX.drop();
    schedulePersist();
    return true;
  }

  performMerge(from, to);
  return true;
}

function performMerge(from: CellId, to: CellId) {
  const a = state.board[from];
  const b = state.board[to];
  if (!a || !b || a.category !== b.category || a.level !== b.level) return;
  const cat = a.category;
  const newLevel = Math.min(MAX_LEVEL, a.level + 1);
  const board = state.board.slice();
  board[from] = null;
  board[to] = { id: uid(), category: cat, level: newLevel, bornAt: Date.now() };
  set({ board });

  bumpCombo();
  trackCategoryMerge(cat);
  const item = getItem(cat, newLevel);
  const baseReward = item.mergeReward;
  const finalReward = Math.round(baseReward * state.comboMult);
  awardCoins(finalReward, to);
  pushParticles(to, newLevel, cat);
  SFX.merge(newLevel);

  gainXP(GAME_CONFIG.XP_PER_MERGE(newLevel));
  unlockAchievement("first_merge");
  trackMission("merge", cat, a.level);
  trackMission("create", cat, newLevel);

  const prevMax = state.unlockedMaxLevelByCategory[cat];
  if (newLevel > prevMax) {
    set(s => ({
      unlockedMaxLevelByCategory: { ...s.unlockedMaxLevelByCategory, [cat]: newLevel },
    }));
    pushBanner({ title: "New Item Unlocked!", subtitle: item.name, variant: "reward" });
  }
  if (newLevel >= 5)  unlockAchievement("create_l5");
  if (newLevel >= 7)  unlockAchievement("create_l7");
  if (newLevel >= 10) unlockAchievement("create_l10");

  scheduleChainMerge(to);
  schedulePersist();
}

function neighborsOf(cell: CellId): CellId[] {
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  const out: CellId[] = [];
  if (r > 0) out.push(cell - SIZE);
  if (r < SIZE - 1) out.push(cell + SIZE);
  if (c > 0) out.push(cell - 1);
  if (c < SIZE - 1) out.push(cell + 1);
  return out;
}

function scheduleChainMerge(cell: CellId) {
  window.setTimeout(() => {
    const tile = state.board[cell];
    if (!tile) return;
    const match = neighborsOf(cell).find(n => {
      const t = state.board[n];
      return t && t.category === tile.category && t.level === tile.level && tile.level < MAX_LEVEL;
    });
    if (match != null) performMerge(match, cell);
  }, 220);
}

// -------------------- spawn engine --------------------
/** Pick a level for a freshly spawned tile (1 = 85%, 2 = 15%). */
function rollSpawnLevel(): number {
  return Math.random() < 0.85 ? 1 : Math.min(GAME_CONFIG.AUTO_SPAWN_MAX_LEVEL, 2);
}

/** Place a fresh tile in the first empty cell. Returns the cell id, or null. */
function placeFresh(category: CategoryId, level: number): CellId | null {
  const idx = state.board.findIndex(c => c === null);
  if (idx < 0) return null;
  const board = state.board.slice();
  board[idx] = { id: uid(), category, level, bornAt: Date.now() };
  set({ board });
  return idx;
}

/**
 * Auto-spawn driver — called from a timer.
 * Only fires while phase === "playing".
 * Cycle: 5s, 6s, 7s, ..., 40s (36 spawns) then resets.
 */
export function autoSpawnTick() {
  if (state.phase !== "playing") return;

  const now = Date.now();
  if (state.nextSpawnAt <= 0) {
    set({ nextSpawnAt: now + scaledInterval(spawnIntervalForIndex(state.spawnIndex)) });
    return;
  }
  if (now < state.nextSpawnAt) return;

  // If board is full, hold the timer (don't advance index).
  const empty = state.board.findIndex(c => c === null);
  if (empty < 0) return;

  // Spawn a new tile (level 1 or 2, random category).
  const cat = randomCategory();
  const lvl = rollSpawnLevel();
  const board = state.board.slice();
  board[empty] = { id: uid(), category: cat, level: lvl, bornAt: now };

  // Advance cycle position; reset to 0 after AUTO_SPAWN_CYCLE_LENGTH spawns.
  const nextSpawnIdx = (state.spawnIndex + 1) % GAME_CONFIG.AUTO_SPAWN_CYCLE_LENGTH;
  const nextCyclePos = state.cyclePosition + 1;

  set({
    board,
    spawnIndex: nextSpawnIdx,
    cyclePosition: nextCyclePos,
    nextSpawnAt: now + scaledInterval(spawnIntervalForIndex(nextSpawnIdx)),
  });
  SFX.spawn();
  schedulePersist();
}

/** Apply Speed Boost scaling to an interval. */
function scaledInterval(intervalMs: number): number {
  const speedActive = state.speedBoostUntil > Date.now();
  return speedActive
    ? Math.round(intervalMs / GAME_CONFIG.SPEED_BOOST_MULTIPLIER)
    : intervalMs;
}

/** Clear expired combo. */
export function comboTick() {
  if (state.combo > 0 && Date.now() - state.lastMergeAt > GAME_CONFIG.COMBO_WINDOW_MS) {
    set({ combo: 0, comboMult: 1 });
  }
}

// -------------------- refill --------------------
export interface RefillEligibility {
  /** Number of free ad refills left today (0..DAILY_AD_REFILLS). */
  adRefillsLeftToday: number;
  /** Permanent referral credits available. */
  referralCredits: number;
  /** True if the player can refill at all right now. */
  canRefill: boolean;
  /** True if next refill should consume an ad. */
  needsAd: boolean;
  /** Number of currently empty board cells. */
  emptyCells: number;
}

export function getRefillEligibility(): RefillEligibility {
  const empty = state.board.filter(c => c == null).length;
  const adLeft = Math.max(0, GAME_CONFIG.DAILY_AD_REFILLS - state.refillsUsedToday);
  const referral = state.referralRefillCredits;
  return {
    adRefillsLeftToday: adLeft,
    referralCredits: referral,
    canRefill: empty > 0 && (adLeft > 0 || referral > 0),
    needsAd: adLeft > 0,
    emptyCells: empty,
  };
}

/**
 * Perform a refill: fill ONLY currently empty cells with new low-tier tiles.
 * Existing items remain untouched. Caller is responsible for ad gating.
 */
function doRefill(source: "ad" | "referral") {
  const board = state.board.slice();
  let placed = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] != null) continue;
    const cat = randomCategory();
    const lvl = Math.random() < GAME_CONFIG.REFILL_BATCH_LEVEL_1_PROB ? 1 : 2;
    board[i] = { id: uid(), category: cat, level: lvl, bornAt: Date.now() };
    placed++;
  }
  set(s => ({
    board,
    refillsUsedToday: source === "ad" ? s.refillsUsedToday + 1 : s.refillsUsedToday,
    referralRefillCredits: source === "referral" ? Math.max(0, s.referralRefillCredits - 1) : s.referralRefillCredits,
  }));
  SFX.reward();
  pushBanner({
    title: "Board Refilled!",
    subtitle: `+${placed} item${placed === 1 ? "" : "s"} placed`,
    variant: "reward",
  });
  schedulePersist();
  return placed;
}

/** Use the next ad-based refill. Caller must have already shown the ad. */
export function consumeAdRefill(): number {
  const e = getRefillEligibility();
  if (e.emptyCells === 0 || e.adRefillsLeftToday <= 0) return 0;
  return doRefill("ad");
}

/** Use one referral refill credit. */
export function consumeReferralRefill(): number {
  const e = getRefillEligibility();
  if (e.emptyCells === 0 || e.referralCredits <= 0) return 0;
  return doRefill("referral");
}

// -------------------- missions / daily --------------------
export function claimMission(id: string) {
  const m = state.missions.find(x => x.id === id);
  if (!m || !m.done || m.claimed) return;
  set(s => ({ missions: s.missions.map(x => x.id === id ? { ...x, claimed: true } : x) }));
  awardCoins(m.reward, null);
  SFX.coin();
  pushBanner({ title: "Mission Complete!", subtitle: `+${m.reward} coins`, variant: "reward" });
  const remaining = state.missions.filter(x => !x.claimed);
  if (remaining.length === 0) set({ missions: makeMissions(state.level) });
  schedulePersist();
}

export function claimDailyReward(): boolean {
  const today = todayKey();
  if (state.lastDailyClaimKey === today) return false;
  set({ lastDailyClaimKey: today });
  awardCoins(GAME_CONFIG.DAILY_REWARD_COINS, null);
  SFX.reward();
  pushBanner({ title: "Daily Reward!", subtitle: `+${GAME_CONFIG.DAILY_REWARD_COINS} coins`, variant: "reward" });
  schedulePersist();
  return true;
}

// -------------------- boosters --------------------
export function consumeFreeSpeedBoost() {
  if (!state.dailyFreeUses.speedBoost) return;
  set(s => ({ dailyFreeUses: { ...s.dailyFreeUses, speedBoost: false } }));
}

export function activateSpeedBoost() {
  set({ speedBoostUntil: Date.now() + GAME_CONFIG.SPEED_BOOST_DURATION_MS });
  pushBanner({
    title: "2× Speed Boost!",
    subtitle: `Spawns at double speed for 2 min`,
    variant: "reward",
  });
  SFX.boost();
  schedulePersist();
}

export function activateDoubleRewards() {
  set({ doubleRewardsUntil: Date.now() + GAME_CONFIG.DOUBLE_REWARDS_DURATION_MS });
  pushBanner({ title: "2× Rewards Active!", subtitle: "10 minutes", variant: "reward" });
  SFX.reward();
  schedulePersist();
}

// -------------------- misc --------------------
export function setMuted(m: boolean) {
  set({ muted: m });
  schedulePersist();
}

export function nextTutorialStep() {
  set(s => ({ tutorialStep: s.tutorialStep < 0 ? -1 : s.tutorialStep + 1 }));
  schedulePersist();
}
export function finishTutorial() {
  set({ tutorialStep: -1 });
  schedulePersist();
}

// -------------------- selectors --------------------
export const selectors = {
  comboActive: (s: GameState) => s.combo >= 2,
  doubleActive: (s: GameState) => s.doubleRewardsUntil > Date.now(),
  speedActive: (s: GameState) => s.speedBoostUntil > Date.now(),
  xpForNext: (s: GameState) => GAME_CONFIG.XP_TO_NEXT(s.level),
  /** Whether the currently selected tile is sellable (Levels 6+). */
  selectedSellable: (s: GameState) => {
    if (s.selectedCell == null) return false;
    const t = s.board[s.selectedCell];
    return !!t && !!GAME_CONFIG.SELL_TOKEN_REWARD_BY_LEVEL[t.level];
  },
  selectedSellReward: (s: GameState): number => {
    if (s.selectedCell == null) return 0;
    const t = s.board[s.selectedCell];
    if (!t) return 0;
    return GAME_CONFIG.SELL_TOKEN_REWARD_BY_LEVEL[t.level] ?? 0;
  },
  selectedTile: (s: GameState): Tile | null => {
    if (s.selectedCell == null) return null;
    return s.board[s.selectedCell];
  },
  /** Categories currently present on the board. Memoized by board reference + content key. */
  activeCategories: (() => {
    let lastBoard: GameState["board"] | null = null;
    let lastKey = "";
    let lastResult: CategoryId[] = [];
    return (s: GameState): CategoryId[] => {
      if (s.board === lastBoard) return lastResult;
      const set = new Set<CategoryId>();
      s.board.forEach(t => { if (t) set.add(t.category); });
      const key = CATEGORY_IDS.filter(c => set.has(c)).join(",");
      if (key !== lastKey) {
        lastKey = key;
        lastResult = key ? (key.split(",") as CategoryId[]) : [];
      }
      lastBoard = s.board;
      return lastResult;
    };
  })(),
};

export { ITEMS, MAX_LEVEL, getItem, getState };
export type { ItemDef };
