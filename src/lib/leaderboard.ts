import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { fbDb, isFirebaseConfigured } from "./firebase";
import { getCurrentAuth, onAuth } from "./auth";
import { isTelegram } from "./telegram";

export interface LeaderRow {
  uid: string;
  name: string;
  photo: string | null;
  tokens: number;
  level: number;
}

const COLLECTION_PATH = "leaderboards/global/players";

/** ---------- Submit (debounced) ---------- */
let pending: { tokens: number; level: number } | null = null;
let timer: number | null = null;
const DEBOUNCE_MS = 3000;

function flush() {
  timer = null;
  if (!pending) return;
  const data = pending;
  pending = null;
  void writeNow(data.tokens, data.level);
}

async function writeNow(tokens: number, level: number) {
  if (!isFirebaseConfigured) return;
  const db = fbDb();
  const me = getCurrentAuth();
  if (!db || !me) return;
  try {
    await setDoc(
      doc(db, COLLECTION_PATH, me.uid),
      {
        uid: me.uid,
        name: me.name,
        photo: me.photo,
        tokens: Math.max(0, Math.floor(tokens)),
        level: Math.max(1, Math.floor(level)),
        source: isTelegram() ? "telegram" : "web",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn("[leaderboard] write failed", e);
  }
}

/** Schedule a leaderboard update. Coalesces bursts within DEBOUNCE_MS. */
export function submitScore(tokens: number, level: number) {
  if (!isFirebaseConfigured) return;
  pending = { tokens, level };
  if (timer != null) return;
  timer = window.setTimeout(flush, DEBOUNCE_MS);
}

/** Force-flush pending writes (call before tab close). */
export function flushScore() {
  if (timer != null) {
    window.clearTimeout(timer);
    flush();
  }
}

// Auto-flush before the tab closes
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushScore);
  window.addEventListener("beforeunload", flushScore);
}

// Re-submit current score whenever auth resolves (covers anonymous bootstrap)
let lastSubmitted = -1;
onAuth(s => {
  if (s && lastSubmitted >= 0) submitScore(lastSubmitted, 1);
});

/** Track the latest known tokens so re-auth can re-submit. */
export function trackTokens(tokens: number) {
  lastSubmitted = tokens;
}

/** ---------- Subscribe to top players ---------- */
export function subscribeTopPlayers(
  topN: number,
  cb: (rows: LeaderRow[]) => void,
): () => void {
  if (!isFirebaseConfigured) {
    cb([]);
    return () => {};
  }
  const db = fbDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION_PATH),
    orderBy("tokens", "desc"),
    limit(topN),
  );
  return onSnapshot(
    q,
    snap => {
      const rows: LeaderRow[] = snap.docs.map(d => {
        const v = d.data() as Partial<LeaderRow>;
        return {
          uid: v.uid ?? d.id,
          name: v.name ?? "Player",
          photo: v.photo ?? null,
          tokens: v.tokens ?? 0,
          level: v.level ?? 1,
        };
      });
      cb(rows);
    },
    err => {
      console.warn("[leaderboard] subscribe failed", err);
      cb([]);
    },
  );
}
