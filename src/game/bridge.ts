// =====================================================
// Native Android WebView bridge
// The native side may inject `window.GoldCoinBridge` exposing:
//   rewardCoins(amount: number): void
//   showRewardedAd(callback?: string): void  // optional
//   saveGameData(json: string): void
//   loadGameData(): string | null
// We provide safe fallbacks so the game runs in any browser.
// =====================================================

declare global {
  interface Window {
    GoldCoinBridge?: {
      rewardCoins?: (amount: number) => void;
      showRewardedAd?: (callbackName?: string) => void;
      saveGameData?: (json: string) => void;
      loadGameData?: () => string | null;
    };
    __goldMergeAdCallback?: (success: boolean) => void;
    onRewardedAdResult?: (success: boolean) => void;
  }
}

const STORAGE_KEY = "goldMergeBoss_save_v1";

/** Award coins to the host wallet (Gold Coin app). Falls back to no-op. */
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
      // Native side calls window.onRewardedAdResult(success)
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
      // Browser fallback — simulate a 1.2s ad
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
