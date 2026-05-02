/**
 * Telegram Mini App bridge.
 * Detects whether we're running inside Telegram and exposes a tiny typed API
 * over `window.Telegram.WebApp`. Safe to call on plain web — every helper
 * no-ops when Telegram isn't available.
 *
 * Telegram WebApp script is loaded from index.html.
 * Docs: https://core.telegram.org/bots/webapps
 */

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; start_param?: string };
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string, opts?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  MainButton: {
    text: string;
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setParams: (p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function tg(): TgWebApp | null {
  return typeof window !== "undefined" ? window.Telegram?.WebApp ?? null : null;
}

export function isTelegram(): boolean {
  const w = tg();
  // initData is non-empty only inside the actual Telegram client
  return !!w && typeof w.initData === "string" && w.initData.length > 0;
}

/** Boot — call once on app start. */
export function initTelegram() {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
  } catch {
    /* ignore */
  }
}

export function telegramUser(): TelegramUser | null {
  return tg()?.initDataUnsafe?.user ?? null;
}

export function telegramStartParam(): string | null {
  return tg()?.initDataUnsafe?.start_param ?? null;
}

export function tgHaptic(kind: "light" | "medium" | "heavy" = "light") {
  tg()?.HapticFeedback?.impactOccurred(kind);
}

export function tgNotify(kind: "success" | "error" | "warning") {
  tg()?.HapticFeedback?.notificationOccurred(kind);
}

export function openExternal(url: string) {
  const w = tg();
  if (w) {
    try {
      w.openLink(url);
      return;
    } catch {
      /* fall through */
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openTelegramShare(url: string, text: string) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const w = tg();
  if (w) {
    try {
      w.openTelegramLink(shareUrl);
      return;
    } catch {
      /* fall through */
    }
  }
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}
