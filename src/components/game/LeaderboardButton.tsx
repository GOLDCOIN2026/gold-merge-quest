import { useEffect, useState } from "react";
import { Trophy, X, Crown, Medal, Award } from "lucide-react";
import { useGame } from "@/game/store";
import { getLeaderboard, type LeaderboardEntry } from "@/game/bridge";
import { SFX } from "@/game/sound";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/auth/AuthContext";

async function getFirebaseLeaderboard(currentUid: string | null): Promise<LeaderboardEntry[] | null> {
  try {
    // Prefer the new "Tokens" field; fall back to legacy "TTokens" if needed.
    let snap;
    try {
      const q = query(collection(db, "users"), orderBy("Tokens", "desc"), limit(50));
      snap = await getDocs(q);
    } catch {
      const q = query(collection(db, "users"), orderBy("TTokens", "desc"), limit(50));
      snap = await getDocs(q);
    }
    const entries: LeaderboardEntry[] = [];
    snap.forEach(doc => {
      const d = doc.data() as any;
      entries.push({
        id: doc.id,
        name: d.username ?? "Player",
        tokens: Number(d.Tokens ?? d.TTokens ?? 0),
        isMe: doc.id === currentUid,
      });
    });
    return entries;
  } catch (e) {
    console.warn("Firebase leaderboard unavailable, falling back", e);
    return null;
  }
}

/**
 * Global leaderboard of top players ranked by total Gold Tokens earned.
 * Pulls from the native bridge if available, otherwise from a local mirror
 * that's seeded with demo players + the current player's running total.
 */
export function LeaderboardButton() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const myTokens = useGame(s => s.tokens);
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const fb = await getFirebaseLeaderboard(user?.uid ?? null);
      if (cancelled) return;
      if (fb && fb.length > 0) {
        setList(fb);
        setLoading(false);
        return;
      }
      const local = await getLeaderboard();
      if (cancelled) return;
      setList(local);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, myTokens, user?.uid]);

  const myRank = list.findIndex(e => e.isMe) + 1;

  return (
    <>
      <button
        onClick={() => { SFX.click(); setOpen(true); }}
        className="panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold hover:shadow-gold transition-shadow"
        aria-label="Leaderboard"
      >
        <Trophy className="h-4 w-4 text-amber-300" />
        <span className="hidden xs:inline">Top</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel-gold rounded-3xl p-5 w-full max-w-md max-h-[85vh] flex flex-col shadow-popup animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-300" /> Global Leaderboard
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Top players ranked by total Gold Tokens earned.
            </p>

            {myRank > 0 && (
              <div className="mb-3 panel-gold rounded-xl px-3 py-2 flex items-center gap-3 border border-gold-500/40">
                <span className="text-xs font-bold text-gold tabular-nums w-6 text-center">#{myRank}</span>
                <span className="text-sm font-bold flex-1 truncate">You</span>
                <span className="text-sm font-extrabold text-gold tabular-nums">{myTokens.toLocaleString()}</span>
              </div>
            )}

            <div className="overflow-y-auto no-scrollbar flex-1 space-y-1.5 pr-1">
              {loading && (
                <div className="text-xs text-muted-foreground text-center py-6">Loading…</div>
              )}
              {!loading && list.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Be the first to earn Gold Tokens!
                </div>
              )}
              {!loading && list.map((entry, i) => (
                <LeaderboardRow key={entry.id} entry={entry} rank={i + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const Icon = rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Award : null;
  const rankColor =
    rank === 1 ? "text-amber-300" :
    rank === 2 ? "text-slate-200" :
    rank === 3 ? "text-orange-400" :
    "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl",
        entry.isMe
          ? "bg-gold-500/15 border border-gold-500/40"
          : "bg-secondary/40",
      )}
    >
      <span className={cn("w-7 text-center text-xs font-extrabold tabular-nums flex items-center justify-center", rankColor)}>
        {Icon ? <Icon className="h-4 w-4" /> : `#${rank}`}
      </span>
      <span className="flex-1 text-sm font-bold truncate">
        {entry.name}{entry.isMe && <span className="ml-1 text-[10px] text-gold-300">(you)</span>}
      </span>
      <span className="text-sm font-extrabold text-gold tabular-nums">
        {entry.tokens.toLocaleString()}
      </span>
    </div>
  );
}
