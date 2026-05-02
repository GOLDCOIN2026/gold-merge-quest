import { useEffect, useState } from "react";
import { Trophy, X, Crown, Medal, Award } from "lucide-react";
import { useGame } from "@/game/store";
import { onAuth, type AuthSnapshot } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeTopPlayers, type LeaderRow } from "@/lib/leaderboard";
import { SFX } from "@/game/sound";
import { cn } from "@/lib/utils";

/**
 * Global leaderboard — live Firestore subscription.
 * Falls back to a friendly empty state when Firebase isn't configured yet.
 */
export function LeaderboardButton() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<LeaderRow[]>([]);
  const [me, setMe] = useState<AuthSnapshot | null>(null);
  const myTokens = useGame(s => s.tokens);

  useEffect(() => onAuth(setMe), []);

  useEffect(() => {
    if (!open) return;
    return subscribeTopPlayers(50, setList);
  }, [open]);

  const myRank = me ? list.findIndex(e => e.uid === me.uid) + 1 : 0;
  const inTop = myRank > 0;

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
              Top 50 players ranked by total Gold Tokens earned.
            </p>

            {!isFirebaseConfigured && (
              <div className="mb-3 rounded-xl bg-secondary/40 border border-gold-700/40 p-3 text-[11px] text-muted-foreground">
                Connect Firebase in <code className="text-gold-200">src/lib/firebase.ts</code> to enable
                the live global leaderboard.
              </div>
            )}

            {me && !inTop && (
              <div className="mb-3 panel-gold rounded-xl px-3 py-2 flex items-center gap-3 border border-gold-500/40">
                <span className="text-xs font-bold text-gold tabular-nums w-10 text-center">—</span>
                <Avatar photo={me.photo} name={me.name} />
                <span className="text-sm font-bold flex-1 truncate">You</span>
                <span className="text-sm font-extrabold text-gold tabular-nums">{myTokens.toLocaleString()}</span>
              </div>
            )}

            <div className="overflow-y-auto no-scrollbar flex-1 space-y-1.5 pr-1">
              {list.length === 0 && isFirebaseConfigured && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No scores yet — be the first on the board!
                </div>
              )}
              {list.map((entry, i) => (
                <LeaderboardRow
                  key={entry.uid}
                  entry={entry}
                  rank={i + 1}
                  isMe={!!me && entry.uid === me.uid}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Avatar({ photo, name }: { photo: string | null; name: string }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="h-7 w-7 rounded-full object-cover border border-gold-700/50 shrink-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="h-7 w-7 rounded-full bg-gradient-gold text-primary-foreground text-xs font-extrabold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}

function LeaderboardRow({
  entry, rank, isMe,
}: { entry: LeaderRow; rank: number; isMe: boolean }) {
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
        isMe ? "bg-gold-500/15 border border-gold-500/40" : "bg-secondary/40",
      )}
    >
      <span className={cn("w-7 text-center text-xs font-extrabold tabular-nums flex items-center justify-center", rankColor)}>
        {Icon ? <Icon className="h-4 w-4" /> : `#${rank}`}
      </span>
      <Avatar photo={entry.photo} name={entry.name} />
      <span className="flex-1 text-sm font-bold truncate">
        {entry.name}{isMe && <span className="ml-1 text-[10px] text-gold-300">(you)</span>}
      </span>
      <span className="text-sm font-extrabold text-gold tabular-nums">
        {entry.tokens.toLocaleString()}
      </span>
    </div>
  );
}
