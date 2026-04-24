// =====================================================
// GOLD MERGE BOSS — Core game store
// Pure React state via useSyncExternalStore. No deps.
// =====================================================

import { useSyncExternalStore } from "react";
import { GAME_CONFIG } from "./config";
import { ITEMS, MAX_LEVEL, getItem } from "./items";
import { rewardCoins as bridgeReward, saveGameData, loadGameData } from "./bridge";
import { SFX } from "./sound";

// -------------------- types --------------------
export type CellId = number; // 0 .. BOARD_SIZE^2 - 1

export interface Tile {
  id: string;
  level: number;
  bornAt: number; // timestamp for spawn animation
}

export interface FloatText {
  id: string;
  cell: CellId;
  text: string;
  variant: "coin" | "combo" | "xp";
}

export interface Mission {
  id: string;
  description: string;
  /** kind = "merge" | "create" */
  kind: "merge" | "create";
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

export interface GameState {
  board: (Tile | null)[];
  coins: number;
  totalCoinsEarnedToday: number;
  todayKey: string; // YYYY-MM-DD
  lastDailyClaimKey: string | null;

  xp: number;
  level: number;

  combo: number;
  comboMult: number;
  lastMergeAt: number;

  missions: Mission[];
  achievements: Achievement[];
  unlockedMaxLevel: number;

  floats: FloatText[];
  banners: BannerMsg[];
  particles: { id: string; cell: CellId; level: number }[];

  // Boosters
  doubleRewardsUntil: number;
  speedBoostUntil: number;

  // Tutorial
  tutorialStep: number; // 0 = not started, -1 = done

  muted: boolean;
  generatorReadyAt: number;
  lastSpawnAt: number;
}

// -------------------- helpers --------------------
const SIZE = GAME_CONFIG.BOARD_SIZE;
const CELLS = SIZE * SIZE;
const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);

function makeMissions(playerLevel: number): Mission[] {
  const tier = Math.min(MAX_LEVEL - 1, 2 + Math.floor(playerLevel / 3));
  return [
    {
      id: uid(),
      description: `Merge ${10 + playerLevel * 2} ${getItem(2).name}s`,
      kind: "merge", level: 2, target: 10 + playerLevel * 2, progress: 0,
      reward: 80 + playerLevel * 20, done: false, claimed: false,
    },
    {
      id: uid(),
      description: `Create 3 ${getItem(Math.min(4, tier)).name}s`,
      kind: "create", level: Math.min(4, tier), target: 3, progress: 0,
      reward: 150 + playerLevel * 30, done: false, claimed: false,
    },
    {
      id: uid(),
      description: `Create 1 ${getItem(Math.min(MAX_LEVEL, tier + 1)).name}`,
      kind: "create", level: Math.min(MAX_LEVEL, tier + 1), target: 1, progress: 0,
      reward: 300 + playerLevel * 40, done: false, claimed: false,
    },
  ];
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first_merge", name: "First Merge!", description: "Perform your first merge", unlocked: false },
  { id: "combo_3", name: "On Fire", description: "Reach a 3x combo", unlocked: false },
  { id: "combo_5", name: "Unstoppable", description: "Reach a 5x combo", unlocked: false },
  { id: "create_coin", name: "Minted", description: "Create your first Gold Coin", unlocked: false },
  { id: "create_chest", name: "Treasure Hunter", description: "Create a Gold Chest", unlocked: false },
  { id: "create_vault", name: "Banker", description: "Create a Gold Vault", unlocked: false },
  { id: "create_crown", name: "Royalty", description: "Forge the Golden Crown", unlocked: false },
  { id: "level_5", name: "Apprentice", description: "Reach player level 5", unlocked: false },
  { id: "level_10", name: "Expert Merger", description: "Reach player level 10", unlocked: false },
  { id: "earn_1000", name: "Wealthy", description: "Earn 1,000 coins", unlocked: false },
];

function emptyBoard(): (Tile | null)[] {
  return Array.from({ length: CELLS }, () => null);
}

function seedBoard(): (Tile | null)[] {
  const b = emptyBoard();
  // sprinkle a few starter items
  const positions = [7, 9, 14, 16, 21, 28];
  positions.forEach((p, i) => {
    b[p] = { id: uid(), level: i < 4 ? 1 : 2, bornAt: Date.now() };
  });
  return b;
}

function defaultState(): GameState {
  return {
    board: seedBoard(),
    coins: 0,
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
    unlockedMaxLevel: 1,
    floats: [],
    banners: [],
    particles: [],
    doubleRewardsUntil: 0,
    speedBoostUntil: 0,
    tutorialStep: 0,
    muted: false,
    generatorReadyAt: 0,
    lastSpawnAt: 0,
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
  coins: number; totalCoinsEarnedToday: number; todayKey: string;
  lastDailyClaimKey: string | null;
  xp: number; level: number;
  missions: Mission[];
  achievements: Achievement[];
  unlockedMaxLevel: number;
  doubleRewardsUntil: number; speedBoostUntil: number;
  tutorialStep: number;
  muted: boolean;
}

function persist() {
  const s = state;
  const blob: SaveBlob = {
    board: s.board,
    coins: s.coins, totalCoinsEarnedToday: s.totalCoinsEarnedToday, todayKey: s.todayKey,
    lastDailyClaimKey: s.lastDailyClaimKey,
    xp: s.xp, level: s.level,
    missions: s.missions, achievements: s.achievements, unlockedMaxLevel: s.unlockedMaxLevel,
    doubleRewardsUntil: s.doubleRewardsUntil, speedBoostUntil: s.speedBoostUntil,
    tutorialStep: s.tutorialStep, muted: s.muted,
  };
  saveGameData(blob);
}

let saveTimer: number | null = null;
function schedulePersist() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(persist, 400);
}

export function loadFromStorage() {
  const blob = loadGameData<SaveBlob>();
  if (!blob) return;
  const today = todayKey();
  set({
    ...blob,
    // reset daily counters if a new day
    todayKey: today,
    totalCoinsEarnedToday: blob.todayKey === today ? blob.totalCoinsEarnedToday : 0,
    floats: [], banners: [], particles: [],
    combo: 0, comboMult: 1, lastMergeAt: 0,
    generatorReadyAt: 0, lastSpawnAt: 0,
  });
}

// -------------------- actions --------------------
function pushFloat(cell: CellId, text: string, variant: FloatText["variant"]) {
  const f: FloatText = { id: uid(), cell, text, variant };
  set(s => ({ floats: [...s.floats, f] }));
  window.setTimeout(() => set(s => ({ floats: s.floats.filter(x => x.id !== f.id) })), 1200);
}

function pushParticles(cell: CellId, level: number) {
  const p = { id: uid(), cell, level };
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
  let mult = state.doubleRewardsUntil > now ? 2 : 1;
  let final = Math.round(amount * mult);
  // daily cap
  const remaining = Math.max(0, GAME_CONFIG.DAILY_COIN_CAP - state.totalCoinsEarnedToday);
  final = Math.min(final, remaining);
  if (final <= 0) return;

  set(s => ({
    coins: s.coins + final,
    totalCoinsEarnedToday: (s.todayKey === today ? s.totalCoinsEarnedToday : 0) + final,
    todayKey: today,
  }));
  bridgeReward(final);
  if (cell != null) pushFloat(cell, `+${final}`, "coin");
  if (state.coins >= 1000) unlockAchievement("earn_1000");
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
    pushBanner({ title: `Level ${level}!`, subtitle: "+1 generator charge", variant: "level" });
    if (level >= 5) unlockAchievement("level_5");
    if (level >= 10) unlockAchievement("level_10");
    // refresh missions every 3 levels
    if (level % 3 === 0) set({ missions: makeMissions(level) });
  }
}

function bumpCombo() {
  const now = Date.now();
  const within = now - state.lastMergeAt < GAME_CONFIG.COMBO_WINDOW_MS;
  const combo = within ? state.combo + 1 : 1;
  const mult = Math.min(GAME_CONFIG.COMBO_MAX_MULT, 1 + Math.floor(combo / 3));
  set({ combo, comboMult: mult, lastMergeAt: now });
  if (combo === 3) { unlockAchievement("combo_3"); pushBanner({ title: "Combo x3!", variant: "combo" }); }
  if (combo === 5) { unlockAchievement("combo_5"); pushBanner({ title: "Combo x5!", variant: "combo" }); }
}

function trackMission(kind: "merge" | "create", level: number) {
  const missions = state.missions.map(m => {
    if (m.done || m.kind !== kind || m.level !== level) return m;
    const progress = Math.min(m.target, m.progress + 1);
    return { ...m, progress, done: progress >= m.target };
  });
  set({ missions });
}

function placeAtFirstEmpty(level: number): CellId | null {
  const idx = state.board.findIndex(c => c === null);
  if (idx < 0) return null;
  const board = state.board.slice();
  board[idx] = { id: uid(), level, bornAt: Date.now() };
  set({ board });
  return idx;
}

/** Drop tile from `from` onto `to`. Returns true if anything happened. */
export function dropTile(from: CellId, to: CellId): boolean {
  if (from === to) return false;
  const a = state.board[from];
  const b = state.board[to];
  if (!a) return false;

  // Empty target → just move
  if (!b) {
    const board = state.board.slice();
    board[to] = a;
    board[from] = null;
    set({ board });
    SFX.drop();
    schedulePersist();
    return true;
  }

  // Different items → swap
  if (a.level !== b.level || a.level >= MAX_LEVEL) {
    const board = state.board.slice();
    board[to] = a;
    board[from] = b;
    set({ board });
    SFX.drop();
    schedulePersist();
    return true;
  }

  // Merge!
  performMerge(from, to);
  return true;
}

function performMerge(from: CellId, to: CellId) {
  const a = state.board[from];
  const b = state.board[to];
  if (!a || !b || a.level !== b.level) return;
  const newLevel = Math.min(MAX_LEVEL, a.level + 1);
  const board = state.board.slice();
  board[from] = null;
  board[to] = { id: uid(), level: newLevel, bornAt: Date.now() };
  set({ board });

  bumpCombo();
  const item = getItem(newLevel);
  const baseReward = item.mergeReward;
  const finalReward = Math.round(baseReward * state.comboMult);
  awardCoins(finalReward, to);
  pushParticles(to, newLevel);
  SFX.merge(newLevel);

  gainXP(GAME_CONFIG.XP_PER_MERGE(newLevel));
  unlockAchievement("first_merge");
  trackMission("merge", a.level);
  trackMission("create", newLevel);

  // Unlocks & per-tier achievements
  if (newLevel > state.unlockedMaxLevel) {
    set({ unlockedMaxLevel: newLevel });
    pushBanner({ title: "New Item Unlocked!", subtitle: item.name, variant: "reward" });
  }
  if (newLevel === 4) unlockAchievement("create_coin");
  if (newLevel === 5) unlockAchievement("create_chest");
  if (newLevel === 6) unlockAchievement("create_vault");
  if (newLevel === 7) unlockAchievement("create_crown");

  // Chain merge — if neighbours of same new level exist, auto-merge into `to`.
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
      return t && t.level === tile.level && tile.level < MAX_LEVEL;
    });
    if (match != null) performMerge(match, cell);
  }, 220);
}

/** Spawn a new low-tier item via the generator button. */
export function generate(): boolean {
  const now = Date.now();
  if (now < state.generatorReadyAt) { SFX.error(); return false; }
  const idx = placeAtFirstEmpty(1);
  if (idx == null) { SFX.error(); pushBanner({ title: "Board is full!", variant: "reward" }); return false; }
  SFX.spawn();
  set({ generatorReadyAt: now + GAME_CONFIG.GENERATOR_COOLDOWN_MS });
  schedulePersist();
  return true;
}

/** Auto-spawn driver — call from a timer. */
export function autoSpawnTick() {
  const now = Date.now();
  const interval = state.speedBoostUntil > now
    ? GAME_CONFIG.AUTO_SPAWN_INTERVAL_MS / GAME_CONFIG.SPEED_BOOST_MULTIPLIER
    : GAME_CONFIG.AUTO_SPAWN_INTERVAL_MS;
  if (now - state.lastSpawnAt < interval) return;
  const empty = state.board.findIndex(c => c === null);
  if (empty < 0) return;
  const lvl = Math.random() < 0.85 ? 1 : Math.min(GAME_CONFIG.AUTO_SPAWN_MAX_LEVEL, 2);
  const board = state.board.slice();
  board[empty] = { id: uid(), level: lvl, bornAt: now };
  set({ board, lastSpawnAt: now });
  SFX.spawn();
  schedulePersist();
}

/** Clear expired combo. */
export function comboTick() {
  if (state.combo > 0 && Date.now() - state.lastMergeAt > GAME_CONFIG.COMBO_WINDOW_MS) {
    set({ combo: 0, comboMult: 1 });
  }
}

export function claimMission(id: string) {
  const m = state.missions.find(x => x.id === id);
  if (!m || !m.done || m.claimed) return;
  set(s => ({ missions: s.missions.map(x => x.id === id ? { ...x, claimed: true } : x) }));
  awardCoins(m.reward, null);
  SFX.coin();
  pushBanner({ title: "Mission Complete!", subtitle: `+${m.reward} coins`, variant: "reward" });
  // refresh if all claimed
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

export function activateDoubleRewards() {
  set({ doubleRewardsUntil: Date.now() + GAME_CONFIG.DOUBLE_REWARDS_DURATION_MS });
  pushBanner({ title: "2x Rewards Active!", subtitle: "10 minutes", variant: "reward" });
  SFX.reward();
  schedulePersist();
}

export function activateSpeedBoost() {
  set({ speedBoostUntil: Date.now() + GAME_CONFIG.SPEED_BOOST_DURATION_MS });
  pushBanner({ title: "Speed Boost!", subtitle: `${GAME_CONFIG.SPEED_BOOST_MULTIPLIER}x spawn for 60s`, variant: "reward" });
  SFX.reward();
  schedulePersist();
}

export function bonusSpawn(count = 3) {
  for (let i = 0; i < count; i++) {
    const idx = placeAtFirstEmpty(Math.random() < 0.6 ? 2 : 3);
    if (idx == null) break;
  }
  SFX.reward();
  pushBanner({ title: "Bonus Items!", subtitle: `+${count} items dropped`, variant: "reward" });
  schedulePersist();
}

// Undo: snapshot last board before an action. Simple single-step undo.
let lastSnapshot: { board: GameState["board"]; coins: number } | null = null;
export function snapshotForUndo() {
  lastSnapshot = { board: state.board.map(t => t ? { ...t } : null), coins: state.coins };
}
export function undoLastMove(): boolean {
  if (!lastSnapshot) return false;
  set({ board: lastSnapshot.board, coins: lastSnapshot.coins });
  lastSnapshot = null;
  SFX.pickup();
  pushBanner({ title: "Undo!", variant: "reward" });
  schedulePersist();
  return true;
}
export function hasUndo() { return !!lastSnapshot; }

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

// Selectors
export const selectors = {
  comboActive: (s: GameState) => s.combo >= 2,
  doubleActive: (s: GameState) => s.doubleRewardsUntil > Date.now(),
  speedActive: (s: GameState) => s.speedBoostUntil > Date.now(),
  xpForNext: (s: GameState) => GAME_CONFIG.XP_TO_NEXT(s.level),
};

export { ITEMS, MAX_LEVEL, getItem, getState };
