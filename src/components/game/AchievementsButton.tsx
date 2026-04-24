import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";

export function AchievementsButton() {
  const [open, setOpen] = useState(false);
  const achievements = useGame(s => s.achievements);
  const unlocked = achievements.filter(a => a.unlocked).length;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold hover:shadow-gold transition-shadow"
      >
        <Trophy className="h-4 w-4 text-gold-300" />
        {unlocked}/{achievements.length}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="panel-gold rounded-3xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto no-scrollbar animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gold flex items-center gap-2"><Trophy className="h-5 w-5" /> Achievements</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {achievements.map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl bg-secondary/50 ${a.unlocked ? "" : "opacity-50"}`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 ${a.unlocked ? "bg-gradient-gold shadow-gold" : "bg-muted"}`}>
                    {a.unlocked ? "🏆" : "🔒"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
