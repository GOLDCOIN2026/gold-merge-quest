import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claimDailyReward, useGame } from "@/game/store";
import { GAME_CONFIG } from "@/game/config";

const todayKey = () => new Date().toISOString().slice(0, 10);

export function DailyRewardButton() {
  const lastClaim = useGame(s => s.lastDailyClaimKey);
  const [open, setOpen] = useState(false);
  const claimedToday = lastClaim === todayKey();

  // Auto-open once per day on mount if unclaimed
  useEffect(() => {
    if (!claimedToday) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`panel-gold h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-shadow ${!claimedToday ? "pulse-gold" : ""}`}
      >
        <Gift className="h-4 w-4 text-gold-300" />
        Daily
      </button>
      {open && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="panel-gold rounded-3xl p-6 w-full max-w-sm text-center animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold-strong mb-4">
              <Gift className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-gold mb-1">Daily Reward</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {claimedToday ? "Come back tomorrow for another reward!" : `Claim ${GAME_CONFIG.DAILY_REWARD_COINS} free coins`}
            </p>
            <Button
              disabled={claimedToday}
              onClick={() => { claimDailyReward(); setOpen(false); }}
              className="btn-gold w-full h-12 text-base font-bold rounded-xl"
            >
              {claimedToday ? "Claimed ✓" : `Claim +${GAME_CONFIG.DAILY_REWARD_COINS}`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
