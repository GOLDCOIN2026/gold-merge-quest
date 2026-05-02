import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { fbAuth, isFirebaseConfigured } from "./firebase";
import { isTelegram, telegramUser } from "./telegram";

export interface AuthSnapshot {
  uid: string;
  name: string;
  photo: string | null;
  isAnonymous: boolean;
  source: "telegram" | "google" | "anon";
}

let current: AuthSnapshot | null = null;
const listeners = new Set<(s: AuthSnapshot | null) => void>();

function emit() {
  listeners.forEach(l => l(current));
}

function snapshot(u: User): AuthSnapshot {
  const tgu = telegramUser();
  const fromTg = isTelegram() && !!tgu;
  return {
    uid: u.uid,
    name:
      u.displayName?.trim() ||
      (fromTg
        ? [tgu?.first_name, tgu?.last_name].filter(Boolean).join(" ") ||
          tgu?.username ||
          "Telegram Player"
        : "Player"),
    photo: u.photoURL || tgu?.photo_url || null,
    isAnonymous: u.isAnonymous,
    source: fromTg ? "telegram" : u.isAnonymous ? "anon" : "google",
  };
}

/** Subscribe to auth changes. Returns an unsubscribe fn. */
export function onAuth(cb: (s: AuthSnapshot | null) => void) {
  listeners.add(cb);
  cb(current);
  return () => listeners.delete(cb);
}

export function getCurrentAuth(): AuthSnapshot | null {
  return current;
}

/** Boot — call once. Subscribes to Firebase auth + signs in anonymously. */
export function initAuth() {
  if (!isFirebaseConfigured) return;
  const auth = fbAuth();
  if (!auth) return;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn("[auth] anonymous sign-in failed", e);
      }
      return;
    }

    // Hydrate Telegram identity onto the Firebase profile (one-time per session)
    const tgu = telegramUser();
    if (isTelegram() && tgu) {
      const desiredName =
        [tgu.first_name, tgu.last_name].filter(Boolean).join(" ") ||
        tgu.username ||
        "Telegram Player";
      const desiredPhoto = tgu.photo_url ?? null;
      if (user.displayName !== desiredName || user.photoURL !== desiredPhoto) {
        try {
          await updateProfile(user, { displayName: desiredName, photoURL: desiredPhoto });
        } catch {
          /* ignore */
        }
      }
    }

    current = snapshot(user);
    emit();
  });
}

/** Upgrade an anonymous account to Google (preserves uid + leaderboard row). */
export async function signInWithGoogle(): Promise<AuthSnapshot | null> {
  if (!isFirebaseConfigured) return null;
  const auth = fbAuth();
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  try {
    if (auth.currentUser?.isAnonymous) {
      const cred = await linkWithPopup(auth.currentUser, provider);
      current = snapshot(cred.user);
    } else {
      const cred = await signInWithPopup(auth, provider);
      current = snapshot(cred.user);
    }
    emit();
    return current;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    // Already linked — fall back to plain sign-in
    if (code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") {
      try {
        const cred = await signInWithPopup(auth, provider);
        current = snapshot(cred.user);
        emit();
        return current;
      } catch (err) {
        console.warn("[auth] google sign-in failed", err);
      }
    } else {
      console.warn("[auth] google sign-in failed", e);
    }
    return null;
  }
}
