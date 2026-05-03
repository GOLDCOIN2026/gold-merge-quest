import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { fbAuth, isFirebaseConfigured } from "./firebase";
import { isTelegram, telegramUser } from "./telegram";

export interface AuthSnapshot {
  uid: string;
  name: string;
  email: string | null;
  photo: string | null;
  isAnonymous: boolean;
  source: "telegram" | "google" | "email" | "anon";
}

let current: AuthSnapshot | null = null;
const listeners = new Set<(s: AuthSnapshot | null) => void>();

function emit() {
  listeners.forEach(l => l(current));
}

function snapshot(u: User): AuthSnapshot {
  const tgu = telegramUser();
  const fromTg = isTelegram() && !!tgu;
  const providerId = u.providerData[0]?.providerId;
  const source: AuthSnapshot["source"] =
    fromTg ? "telegram"
    : providerId === "google.com" ? "google"
    : providerId === "password" ? "email"
    : "anon";
  return {
    uid: u.uid,
    name:
      u.displayName?.trim() ||
      (fromTg
        ? [tgu?.first_name, tgu?.last_name].filter(Boolean).join(" ") ||
          tgu?.username ||
          "Telegram Player"
        : u.email?.split("@")[0] || "Player"),
    email: u.email,
    photo: u.photoURL || tgu?.photo_url || null,
    isAnonymous: u.isAnonymous,
    source,
  };
}

export function onAuth(cb: (s: AuthSnapshot | null) => void) {
  listeners.add(cb);
  cb(current);
  return () => listeners.delete(cb);
}

export function getCurrentAuth(): AuthSnapshot | null {
  return current;
}

export function initAuth() {
  if (!isFirebaseConfigured) return;
  const auth = fbAuth();
  if (!auth) return;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      current = null;
      emit();
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn("[auth] anonymous sign-in failed", e);
      }
      return;
    }

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
        } catch { /* ignore */ }
      }
    }

    current = snapshot(user);
    emit();
  });
}

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

/** Sign up with email + password. Sets displayName to `username`. */
export async function signUpWithEmail(username: string, email: string, password: string): Promise<AuthSnapshot> {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  const auth = fbAuth();
  if (!auth) throw new Error("Firebase auth unavailable");
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (username.trim()) {
    await updateProfile(cred.user, { displayName: username.trim() });
  }
  current = snapshot(cred.user);
  emit();
  return current;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSnapshot> {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  const auth = fbAuth();
  if (!auth) throw new Error("Firebase auth unavailable");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  current = snapshot(cred.user);
  emit();
  return current;
}

export async function signOutUser(): Promise<void> {
  const auth = fbAuth();
  if (!auth) return;
  await signOut(auth);
  current = null;
  emit();
}
