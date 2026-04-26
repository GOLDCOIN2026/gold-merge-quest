// =====================================================
// Native Android WebView bridge
// The native side may inject `window.GoldCoinBridge` exposing:
//   rewardCoins(amount: number): void
//   showRewardedAd(callback?: string): void
//   saveGameData(json: string): void
//   loadGameData(): string | null
//   closeApp(): void
//   getReferralCount(): number          // optional
//   getReferralLink(): string           // optional — referral share URL
//   getPlayerId(): string               // optional — stable id used for leaderboards
//   getPlayerName(): string             // optional — display name
//   submitLeaderboardScore(tokens): void// optional — push tokens to global board
//   getLeaderboard(callback): void      // optional — fetch global top players
//   shareText(text): void               // optional — native share sheet
// We provide safe fallbacks so the game runs in any browser.
// =====================================================

declare global {
  interface Window {
    GoldCoinBridge?: {
      rewardCoins?: (amount: number) => void;
      showRewardedAd?: (callbackName?: string) => void;
      saveGameData?: (json: string) => void;
      loadGameData?: () => string | null;
      closeApp?: () => void;
      getReferralCount?: () => number;
      getReferralLink?: () => string;
      getPlayerId?: () => string;
      getPlayerName?: () => string;
      submitLeaderboardScore?: (tokens: number) => void;
      getLeaderboard?: (callbackName: string) => void;
      shareText?: (text: string) => void;
    };
    __goldMergeAdCallback?: (success: boolean) => void;
    onRewardedAdResult?: (success: boolean) => void;
    onLeaderboardResult?: (json: string) => void;
  }
}

const STORAGE_KEY = "goldMergeBoss_save_v2";
const LEADERBOARD_KEY = "goldMergeBoss_leaderboard_v1";
const PLAYER_ID_KEY = "goldMergeBoss_playerId_v1";
const PLAYER_NAME_KEY = "goldMergeBoss_playerName_v1";

/** Award coins/tokens to the host wallet (Gold Coin app). */
export function rewardCoins(amount: number): void {
  if (amount <= 0) return;
  try {
    if (window.GoldCoinBridge?.rewardCoins) {
      window.GoldCoinBridge.rewardCoins(amount);
    } else {
      // eslint-disable-next-line no-console
      console.info(`[bridge] rewardCoins(${amount}) — no native bridge`);
    }
  } catch (e) {
    console.warn("rewardCoins failed", e);
  }
}

/** Show a rewarded ad. Resolves true on completion, false on skip/error. */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const native = window.GoldCoinBridge?.showRewardedAd;
    if (native) {
      window.onRewardedAdResult = (success: boolean) => {
        resolve(!!success);
        window.onRewardedAdResult = undefined;
      };
      try {
        native("onRewardedAdResult");
      } catch (e) {
        console.warn("showRewardedAd failed", e);
        resolve(false);
      }
    } else {
      // Browser fallback — simulate a short successful ad
      setTimeout(() => resolve(true), 1200);
    }
  });
}

/** Persist game data via native bridge or localStorage. */
export function saveGameData(data: unknown): void {
  const json = JSON.stringify(data);
  try {
    if (window.GoldCoinBridge?.saveGameData) {
      window.GoldCoinBridge.saveGameData(json);
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.warn("saveGameData failed", e);
  }
}

/** Load game data via native bridge or localStorage. */
export function loadGameData<T = unknown>(): T | null {
  try {
    let json: string | null | undefined = window.GoldCoinBridge?.loadGameData?.();
    if (!json) json = localStorage.getItem(STORAGE_KEY);
    return json ? (JSON.parse(json) as T) : null;
  } catch (e) {
    console.warn("loadGameData failed", e);
    return null;
  }
}

/** Read the player's total successful referral count from the host app. */
export function getReferralCount(): number {
  try {
    const n = window.GoldCoinBridge?.getReferralCount?.();
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) return Math.floor(n);
  } catch (e) {
    console.warn("getReferralCount failed", e);
  }
  return 0;
}

/** Stable per-device player id. Falls back to a generated UUID stored locally. */
export function getPlayerId(): string {
  try {
    const native = window.GoldCoinBridge?.getPlayerId?.();
    if (native && typeof native === "string") return native;
  } catch { /* noop */ }
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

/** Display name for leaderboard. Falls back to "Player ####". */
export function getPlayerName(): string {
  try {
    const native = window.GoldCoinBridge?.getPlayerName?.();
    if (native && typeof native === "string") return native;
  } catch { /* noop */ }
  let name = localStorage.getItem(PLAYER_NAME_KEY);
  if (!name) {
    name = "Player " + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
  return name;
}

export function setPlayerName(name: string): void {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return;
  localStorage.setItem(PLAYER_NAME_KEY, trimmed);
}

/** Build a shareable referral link. Prefers native bridge value. */
export function getReferralLink(): string {
  try {
    const native = window.GoldCoinBridge?.getReferralLink?.();
    if (native && typeof native === "string") return native;
  } catch { /* noop */ }
  return `https://goldcoinweb3.com/?ref=${encodeURIComponent(getPlayerId())}`;
}

/** Native share sheet (Web Share API → bridge → clipboard fallback). */
export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  // Try native bridge first
  try {
    if (window.GoldCoinBridge?.shareText) {
      window.GoldCoinBridge.shareText(text);
      return "shared";
    }
  } catch (e) { console.warn("bridge shareText failed", e); }

  // Web Share API
  try {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
        title: "Gold Coin Merge Quest",
        text,
        url: text.match(/https?:\/\/\S+/)?.[0],
      });
      return "shared";
    }
  } catch (e) {
    // user-cancelled share is fine — try clipboard fallback
    console.info("Web Share cancelled or unavailable", e);
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (e) {
    console.warn("clipboard write failed", e);
    return "failed";
  }
}

// ---------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------

export interface LeaderboardEntry {
  id: string;
  name: string;
  tokens: number;
  isMe?: boolean;
}

/** Submit the player's current Gold Token total to the host leaderboard. */
export function submitLeaderboardScore(tokens: number): void {
  try {
    window.GoldCoinBridge?.submitLeaderboardScore?.(tokens);
  } catch (e) {
    console.warn("submitLeaderboardScore failed", e);
  }
  // Also keep a local mirror so the in-app board always works.
  try {
    const me = { id: getPlayerId(), name: getPlayerName(), tokens };
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : seedLeaderboard();
    const idx = list.findIndex(e => e.id === me.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...me };
    else list.push(me);
    list.sort((a, b) => b.tokens - a.tokens);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn("local leaderboard write failed", e);
  }
}

/**
 * Fetch the leaderboard. Tries native bridge → falls back to local mirror.
 * Always includes the local player so the UI never feels empty.
 */
export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return new Promise((resolve) => {
    const native = window.GoldCoinBridge?.getLeaderboard;
    let resolved = false;
    const finishWithLocal = () => {
      if (resolved) return;
      resolved = true;
      resolve(loadLocalLeaderboard());
    };

    if (native) {
      try {
        window.onLeaderboardResult = (json: string) => {
          if (resolved) return;
          resolved = true;
          try {
            const parsed = JSON.parse(json) as LeaderboardEntry[];
            if (Array.isArray(parsed)) {
              const meId = getPlayerId();
              resolve(parsed.map(e => ({ ...e, isMe: e.id === meId })));
              return;
            }
          } catch { /* fall through */ }
          resolve(loadLocalLeaderboard());
        };
        native("onLeaderboardResult");
        // Safety timeout — fall back to local after 2s.
        setTimeout(finishWithLocal, 2000);
        return;
      } catch (e) {
        console.warn("native getLeaderboard failed", e);
      }
    }
    finishWithLocal();
  });
}

function loadLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : seedLeaderboard();
    const meId = getPlayerId();
    return list
      .map(e => ({ ...e, isMe: e.id === meId }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 50);
  } catch {
    return seedLeaderboard();
  }
}

/** Seed the leaderboard with a few demo players so the UI looks alive on first launch. */
function seedLeaderboard(): LeaderboardEntry[] {
  const seeded: LeaderboardEntry[] = [
    { id: "seed_1", name: "GoldKing",   tokens: 4820 },
    { id: "seed_2", name: "MergeQueen", tokens: 3215 },
    { id: "seed_3", name: "Bullion",    tokens: 2480 },
    { id: "seed_4", name: "VaultLord",  tokens: 1990 },
    { id: "seed_5", name: "ChainSeer",  tokens: 1605 },
    { id: "seed_6", name: "Treasura",   tokens: 1280 },
    { id: "seed_7", name: "Auriel",     tokens: 940 },
    { id: "seed_8", name: "Bricks",     tokens: 720 },
    { id: "seed_9", name: "PennyHunter",tokens: 510 },
    { id: "seed_10",name: "Newbie",     tokens: 230 },
  ];
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(seeded)); } catch { /* noop */ }
  return seeded;
}

/** Close the game / return control to the host Gold Coin app. */
export function closeApp(): void {
  try {
    if (window.GoldCoinBridge?.closeApp) {
      window.GoldCoinBridge.closeApp();
      return;
    }
  } catch (e) {
    console.warn("closeApp failed", e);
  }
  try {
    if (window.history.length > 1) window.history.back();
    else window.close();
  } catch {
    // no-op
  }
}
