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
  consumeFreeBooster,
  type FreeBoosterUses,
} from "@/game/store";
import { showRewardedAd } from "@/game/bridge";
import { SFX } from "@/game/sound";

export function ActionBar() {
  const [adLoading, setAdLoading] = useState<string | null>(null);
  const generatorReadyAt = useGame(s => s.generatorReadyAt);
  const free = useGame(s => s.freeBoosterUses);
  const phase = useGame(s => s.phase);
  const cooling = Date.now() < generatorReadyAt;
  const disabled = phase !== "playing";

  /**
   * Booster activation flow:
   *   1. If a free use is available for this session → activate immediately.
   *   2. Otherwise, request a rewarded ad and only activate on success.
   */
  async function activateBooster(
    key: keyof FreeBoosterUses,
    activate: () => void,
  ) {
    if (disabled) return;
    SFX.click();

    if (free[key]) {
      consumeFreeBooster(key);
      activate();
      SFX.boost();
      return;
    }

    if (adLoading) return;
    setAdLoading(key);
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (!ok) { SFX.error(); return; }
    activate();
    SFX.boost();
  }

  // Bonus spawn keeps simple ad-gated behaviour (not in the free-use spec).
  async function bonusViaAd() {
    if (disabled || adLoading) return;
    SFX.click();
    setAdLoading("bonus");
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (ok) { bonusSpawn(3); SFX.boost(); } else SFX.error();
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <Button
        onClick={() => { SFX.click(); generate(); }}
        disabled={cooling || disabled}
        className="btn-gold h-14 col-span-2 sm:col-span-1 text-base font-bold rounded-2xl"
      >
        <Sparkles className="h-5 w-5 mr-1" />
        Generate
      </Button>

      <BoosterButton
        loading={adLoading === "bonus"}
        disabled={disabled}
        onClick={bonusViaAd}
        icon={<Gift className="h-4 w-4" />}
        label="Bonus"
        free={false}
      />
      <BoosterButton
        loading={adLoading === "speedBoost"}
        disabled={disabled}
        onClick={() => activateBooster("speedBoost", activateSpeedBoost)}
        icon={<Zap className="h-4 w-4" />}
        label="Speed"
        free={free.speedBoost}
      />
      <BoosterButton
        loading={adLoading === "doubleRewards"}
        disabled={disabled}
        onClick={() => activateBooster("doubleRewards", activateDoubleRewards)}
        icon={<PlayCircle className="h-4 w-4" />}
        label="2× Rewards"
        free={free.doubleRewards}
      />
      <BoosterButton
        loading={adLoading === "undo"}
        disabled={disabled || !hasUndo()}
        onClick={() => activateBooster("undo", () => { undoLastMove(); })}
        icon={<Undo2 className="h-4 w-4" />}
        label="Undo"
        free={free.undo}
      />
    </div>
  );
}

function BoosterButton({
  onClick, icon, label, loading, disabled, free,
}: {
  onClick: () => void; icon: React.ReactNode; label: string;
  loading?: boolean; disabled?: boolean; free?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant="outline"
      className="h-14 flex-col gap-0.5 rounded-2xl border-gold-700/50 bg-secondary/50 hover:bg-secondary text-foreground hover:text-gold-200 relative overflow-hidden"
    >
      {free && (
        <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-gradient-gold text-primary-foreground shadow-gold">
          FREE
        </span>
      )}
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
        {loading ? "Loading..." : free ? "Tap to use" : "Watch ad"}
      </span>
    </Button>
  );
}
