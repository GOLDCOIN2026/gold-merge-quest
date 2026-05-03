import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { fbDb, isFirebaseConfigured } from "./firebase";
import { onAuth, type AuthSnapshot } from "./auth";

export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  TTokens: number;
  level: number;
  xp: number;
  referralCount: number;
  refillCredits: number;
  speedBoostCredits: number;
  createdAt?: unknown;
  lastLogin?: unknown;
}

/** Ensure a `users/{uid}` doc exists; updates lastLogin every login. */
export async function ensureProfile(snap: AuthSnapshot): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = fbDb();
  if (!db) return;
  try {
    const ref = doc(db, "users", snap.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        uid: snap.uid,
        username: snap.name,
        email: snap.email,
        TTokens: 0,
        level: 1,
        xp: 0,
        referralCount: 0,
        refillCredits: 0,
        speedBoostCredits: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        {
          username: snap.name,
          email: snap.email,
          lastLogin: serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch (e) {
    console.warn("[profile] ensureProfile failed", e);
  }
}

interface SyncFields {
  tokens: number;
  level: number;
  xp: number;
  referralCount: number;
  refillCredits: number;
  speedBoostCredits: number;
}

let pending: SyncFields | null = null;
let timer: number | null = null;
let currentUid: string | null = null;
const DEBOUNCE_MS = 3000;

async function flush() {
  timer = null;
  if (!pending || !currentUid) return;
  const data = pending;
  pending = null;
  if (!isFirebaseConfigured) return;
  const db = fbDb();
  if (!db) return;
  try {
    await setDoc(
      doc(db, "users", currentUid),
      {
        TTokens: Math.max(0, Math.floor(data.tokens)),
        level: Math.max(1, Math.floor(data.level)),
        xp: Math.max(0, Math.floor(data.xp)),
        referralCount: data.referralCount,
        refillCredits: data.refillCredits,
        speedBoostCredits: data.speedBoostCredits,
      },
      { merge: true },
    );
  } catch (e) {
    console.warn("[profile] sync failed", e);
  }
}

export function syncProfile(fields: SyncFields) {
  if (!isFirebaseConfigured || !currentUid) return;
  pending = fields;
  if (timer != null) return;
  timer = window.setTimeout(flush, DEBOUNCE_MS);
}

export function flushProfile() {
  if (timer != null) {
    window.clearTimeout(timer);
    void flush();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushProfile);
  window.addEventListener("beforeunload", flushProfile);
}

// Track current user + ensure profile doc on auth changes.
onAuth(snap => {
  currentUid = snap?.uid ?? null;
  if (snap) void ensureProfile(snap);
});
