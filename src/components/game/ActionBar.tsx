import { useState } from "react";
import { Sparkles, Zap, Undo2, Gift, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generate,
  useGame,
  hasUndo,
  undoLastMove,
  activateDoubleRewards,
  activateSpeedBoost,
  bonusSpawn,
} from "@/game/store";
import { showRewardedAd } from "@/game/bridge";
import { SFX } from "@/game/sound";

export function ActionBar() {
  const [adLoading, setAdLoading] = useState<string | null>(null);
  const generatorReadyAt = useGame(s => s.generatorReadyAt);
  const cooling = Date.now() < generatorReadyAt;

  async function watchAd(action: string, fn: () => void) {
    if (adLoading) return;
    setAdLoading(action);
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (ok) fn();
    else SFX.error();
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <Button
        onClick={() => generate()}
        disabled={cooling}
        className="btn-gold h-14 col-span-2 sm:col-span-1 text-base font-bold rounded-2xl"
      >
        <Sparkles className="h-5 w-5 mr-1" />
        Generate
      </Button>

      <RewardedButton
        loading={adLoading === "bonus"}
        onClick={() => watchAd("bonus", () => bonusSpawn(3))}
        icon={<Gift className="h-4 w-4" />}
        label="Bonus"
      />
      <RewardedButton
        loading={adLoading === "speed"}
        onClick={() => watchAd("speed", activateSpeedBoost)}
        icon={<Zap className="h-4 w-4" />}
        label="Speed"
      />
      <RewardedButton
        loading={adLoading === "double"}
        onClick={() => watchAd("double", activateDoubleRewards)}
        icon={<PlayCircle className="h-4 w-4" />}
        label="2× 10m"
      />
      <RewardedButton
        loading={adLoading === "undo"}
        disabled={!hasUndo()}
        onClick={() => watchAd("undo", () => { undoLastMove(); })}
        icon={<Undo2 className="h-4 w-4" />}
        label="Undo"
      />
    </div>
  );
}

function RewardedButton({
  onClick, icon, label, loading, disabled,
}: { onClick: () => void; icon: React.ReactNode; label: string; loading?: boolean; disabled?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant="outline"
      className="h-14 flex-col gap-0.5 rounded-2xl border-gold-700/50 bg-secondary/50 hover:bg-secondary text-foreground hover:text-gold-200 relative overflow-hidden"
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
        {loading ? "Loading..." : "Watch ad"}
      </span>
    </Button>
  );
}
