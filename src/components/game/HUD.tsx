import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@/game/config";
import { selectors, useGame } from "@/game/store";
import { Star, Zap, Sparkles } from "lucide-react";

/** Format ms → "M:SS". */
function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function HUD() {
  const level = useGame(s => s.level);
  const xp = useGame(s => s.xp);
  const xpNext = useGame(selectors.xpForNext);
  const combo = useGame(s => s.combo);
  const comboMult = useGame(s => s.comboMult);
  const doubleUntil = useGame(s => s.doubleRewardsUntil);
  const speedUntil = useGame(s => s.speedBoostUntil);
  const earnedToday = useGame(s => s.totalCoinsEarnedToday);
  const cap = GAME_CONFIG.DAILY_COIN_CAP;

  // Tick every second so countdowns stay fresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const doubleActive = doubleUntil > now;
  const speedActive = speedUntil > now;

  const pct = Math.min(100, (xp / xpNext) * 100);
  const capPct = Math.min(100, (earnedToday / cap) * 100);

  return (
    <div className="panel-gold rounded-2xl p-3 space-y-2 text-sm">
      {/* Level + XP */}
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
          <Star className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-gold-500 text-[10px] font-bold flex items-center justify-center text-gold-200">
            {level}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1">
            <span>Level {level}</span>
            <span className="tabular-nums">{xp}/{xpNext} XP</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-gold transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combo + booster timers */}
      <div className="flex items-center gap-2 flex-wrap">
        {combo >= 2 && (
          <span className="px-2 py-1 rounded-full bg-accent/20 text-accent font-bold text-xs animate-scale-in">
            🔥 Combo {combo} · ×{comboMult}
          </span>
        )}
        {doubleActive && (
          <span className="px-2 py-1 rounded-full bg-gold-500/20 text-gold-300 font-bold text-xs flex items-center gap-1 tabular-nums">
            <Sparkles className="h-3 w-3" /> 2× {fmt(doubleUntil - now)}
          </span>
        )}
        {speedActive && (
          <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center gap-1 tabular-nums">
            <Zap className="h-3 w-3" /> Speed {fmt(speedUntil - now)}
          </span>
        )}
      </div>

      {/* Daily cap */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>Daily earnings</span>
          <span className="tabular-nums">{earnedToday.toLocaleString()} / {cap.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all"
            style={{ width: `${capPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
