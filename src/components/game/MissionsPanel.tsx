import { useGame, claimMission } from "@/game/store";
import { getItem, getCategory } from "@/game/items";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";

export function MissionsPanel() {
  const missions = useGame(s => s.missions);
  return (
    <div className="panel-gold rounded-2xl p-3 space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-300 mb-1">Missions</h3>
      {missions.map(m => {
        const item = getItem(m.category, m.level);
        const cat = getCategory(m.category);
        const pct = Math.min(100, (m.progress / m.target) * 100);
        return (
          <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50">
            <div
              className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: `radial-gradient(circle, ${cat.glow}, transparent 70%)` }}
            >
              <img src={item.image} alt="" className="h-full w-full object-contain drop-shadow" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">{m.description}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: cat.hue }} />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">{m.progress}/{m.target}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1 text-gold-300 text-xs font-bold">
                <Sparkles className="h-3 w-3" /> {m.reward} XP
              </div>
              {m.claimed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Button
                  onClick={() => claimMission(m.id)}
                  disabled={!m.done}
                  size="sm"
                  className="h-6 px-2 text-[10px] btn-gold disabled:opacity-40 disabled:bg-secondary disabled:text-muted-foreground"
                >
                  Claim
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
