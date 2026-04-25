// =====================================================
// Native Android WebView bridge
// The native side may inject `window.GoldCoinBridge` exposing:
//   rewardCoins(amount: number): void
//   showRewardedAd(callback?: string): void
//   saveGameData(json: string): void
//   loadGameData(): string | null
//   closeApp(): void
//   getReferralCount(): number          // optional
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
    };
    __goldMergeAdCallback?: (success: boolean) => void;
    onRewardedAdResult?: (success: boolean) => void;
  }
}

const STORAGE_KEY = "goldMergeBoss_save_v2";

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

/**
 * Read the player's total successful referral count from the host app.
 * Returns 0 if the bridge isn't injected.
 */
export function getReferralCount(): number {
  try {
    const n = window.GoldCoinBridge?.getReferralCount?.();
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) return Math.floor(n);
  } catch (e) {
    console.warn("getReferralCount failed", e);
  }
  return 0;
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
