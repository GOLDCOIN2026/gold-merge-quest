import { useState } from "react";
import { Zap, Sparkles, Repeat, Users, Loader2, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGame,
  activateSpeedBoost,
  consumeFreeSpeedBoost,
  consumeAdSpeedBoost,
  consumeAdRefill,
  consumeReferralRefill,
  consumeExtraAdRefill,
  getRefillEligibility,
  getSpeedBoostEligibility,
  selectors,
} from "@/game/store";
import { showRewardedAd } from "@/game/bridge";
import { SFX } from "@/game/sound";

/**
 * Bottom action bar — Refill + 2× Speed Boost.
 * The manual Generate button has been removed; items now spawn automatically.
 *
 * Refill priority:
 *   1) DAILY_AD_REFILLS free refills/day (ad-gated)
 *   2) Referral refill credits (no ad)
 *   3) Extra ad-gated refills (unlimited fallback)
 *
 * Speed boost rules:
 *   - 1 free use/day
 *   - Up to 3 ad-based uses/day after that
 */
export function ActionBar() {
  const phase = useGame(s => s.phase);
  const dailyFree = useGame(s => s.dailyFreeUses);
  const refillsUsedToday = useGame(s => s.refillsUsedToday);
  const referralCredits = useGame(s => s.referralRefillCredits);
  const speedActive = useGame(selectors.speedActive);
  const board = useGame(s => s.board);
  const [adLoading, setAdLoading] = useState<"speed" | "refill" | null>(null);
  const [boostExhausted, setBoostExhausted] = useState(false);

  const disabled = phase !== "playing";
  const empty = board.filter(c => c == null).length;

  const e = getRefillEligibility();
  const sb = getSpeedBoostEligibility();

  // ----- Speed Boost -----
  async function handleSpeedBoost() {
    if (disabled || speedActive || adLoading) return;
    SFX.click();
    if (sb.freeAvailable) {
      consumeFreeSpeedBoost();
      activateSpeedBoost();
      return;
    }
    if (sb.adUsesLeft <= 0) {
      setBoostExhausted(true);
      SFX.error();
      return;
    }
    setAdLoading("speed");
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (!ok) { SFX.error(); return; }
    if (!consumeAdSpeedBoost()) {
      setBoostExhausted(true);
      return;
    }
    activateSpeedBoost();
  }

  // ----- Refill -----
  async function handleRefill() {
    if (disabled || adLoading) return;
    if (empty === 0) { SFX.error(); return; }
    SFX.click();

    // Tier 1: Free ad-based refills
    if (e.nextRefillSource === "ad-free") {
      setAdLoading("refill");
      const ok = await showRewardedAd();
      setAdLoading(null);
      if (!ok) { SFX.error(); return; }
      consumeAdRefill();
      return;
    }
    // Tier 2: Referral credits — no ad
    if (e.nextRefillSource === "referral") {
      consumeReferralRefill();
      return;
    }
    // Tier 3: Extra ad refill — always available as a fallback
    setAdLoading("refill");
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (!ok) { SFX.error(); return; }
    consumeExtraAdRefill();
  }

  // Speed-button label helper
  const speedSubLabel = speedActive
    ? "Active"
    : sb.freeAvailable
      ? "Free today"
      : sb.adUsesLeft > 0
        ? `Watch ad · ${sb.adUsesLeft}/${sb.adUsesMax} left`
        : "Daily limit reached";

  // Refill label helper
  const refillSubLabel =
    empty === 0
      ? "Board full"
      : e.nextRefillSource === "ad-free"
        ? `Watch ad · ${e.adRefillsLeftToday}/2 free`
        : e.nextRefillSource === "referral"
          ? `Use credit · ${e.referralCredits} avail.`
          : "Watch ad · extra refill";

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {/* Refill */}
        <Button
          onClick={handleRefill}
          disabled={disabled || adLoading !== null || empty === 0}
          className="btn-gold h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5 relative overflow-hidden"
        >
          {adLoading === "refill" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Repeat className="h-5 w-5" />
          )}
          <span>Refill Board</span>
          <span className="text-[10px] font-semibold opacity-90">{refillSubLabel}</span>
        </Button>

        {/* Speed Boost */}
        <Button
          onClick={handleSpeedBoost}
          disabled={disabled || speedActive || adLoading !== null || (!sb.freeAvailable && sb.adUsesLeft <= 0)}
          variant="outline"
          className="h-16 flex-col gap-0.5 rounded-2xl border-cyan-400/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-foreground hover:text-cyan-200 relative overflow-hidden"
        >
          {sb.freeAvailable && !speedActive && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-gradient-gold text-primary-foreground shadow-gold">
              FREE
            </span>
          )}
          {adLoading === "speed" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5 text-cyan-300" />
          )}
          <span className="text-sm font-bold">2× Speed</span>
          <span className="text-[10px] font-semibold opacity-90">{speedSubLabel}</span>
        </Button>
      </div>

      {/* Speed boost daily-limit modal */}
      {boostExhausted && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in"
          onClick={() => setBoostExhausted(false)}
        >
          <div
            className="panel-gold rounded-3xl p-6 w-full max-w-xs text-center shadow-popup animate-scale-in"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-3">
              <Tv className="h-8 w-8 text-cyan-300" />
            </div>
            <h2 className="text-lg font-extrabold text-gold mb-1">Daily Limit Reached</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You've used today's free boost and all {sb.adUsesMax} ad-based 2× Speed boosts.
              Come back tomorrow for a fresh allowance.
            </p>
            <Button
              onClick={() => { SFX.click(); setBoostExhausted(false); }}
              className="btn-gold w-full h-11 font-bold rounded-xl"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Got it
            </Button>
            <div className="mt-3 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3 inline -mt-0.5 mr-1" />
              {referralCredits} referral credit{referralCredits === 1 ? "" : "s"} ·
              {" "}{refillsUsedToday}/2 free refills used
            </div>
          </div>
        </div>
      )}
    </>
  );
}
