import { useState } from "react";
import { Zap, Sparkles, Repeat, Loader2, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGame,
  activateSpeedBoost,
  consumeAdSpeedBoost,
  consumeAdRefill,
  consumeReferralRefill,
  getRefillEligibility,
  getSpeedBoostEligibility,
  selectors,
} from "@/game/store";
import { showRewardedAd } from "@/game/bridge";
import { SFX } from "@/game/sound";
import { useAuth } from "@/auth/AuthContext";

/**
 * Bottom action bar — Refill + 2× Speed Boost.
 *
 * Refill rules:
 *   - Max 2 uses per 24 hours.
 *   - If referral credit is available → consumes credit (no ad).
 *   - Otherwise → requires a rewarded ad.
 *   - "Refill (X)" label, where X = referral credits remaining.
 *
 * Speed boost rules:
 *   - Max 2 uses per 24 hours.
 *   - Always requires a rewarded ad (no free use).
 *   - Boosts spawn rate to 1.5s for 1 minute.
 */
export function ActionBar() {
  const phase = useGame(s => s.phase);
  const speedActive = useGame(selectors.speedActive);
  const board = useGame(s => s.board);
  // Subscribe to refill counters so the button label re-renders.
  useGame(s => s.refillsUsedToday);
  useGame(s => s.referralRefillCredits);
  useGame(s => s.dailyFreeUses);
  const { profile } = useAuth();
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
    if (e.refillsLeftToday <= 0) { SFX.error(); return; }
    SFX.click();

    if (e.nextRefillSource === "referral") {
      consumeReferralRefill();
      return;
    }
    setAdLoading("refill");
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (!ok) { SFX.error(); return; }
    consumeAdRefill();
  }

  // Speed-button label helper
  const speedSubLabel = speedActive
    ? "Active"
    : sb.adUsesLeft > 0
      ? `Watch ad · ${sb.adUsesUsed}/${sb.adUsesMax} used`
      : "Daily limit reached";

  // Refill label helper
  const refillSubLabel =
    empty === 0
      ? "Board full"
      : e.refillsLeftToday <= 0
        ? "Daily limit reached"
        : e.nextRefillSource === "referral"
          ? `Use credit · ${e.refillsUsedToday}/${e.refillsMax} used`
          : `Watch ad · ${e.refillsUsedToday}/${e.refillsMax} used`;

  const refillBtnDisabled =
    disabled || adLoading !== null || empty === 0 || e.refillsLeftToday <= 0;
  const speedBtnDisabled =
    disabled || speedActive || adLoading !== null || sb.adUsesLeft <= 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {/* Refill */}
        <Button
          onClick={handleRefill}
          disabled={refillBtnDisabled}
          className="btn-gold h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5 relative overflow-hidden transition-all disabled:opacity-50"
        >
          {adLoading === "refill" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Repeat className="h-5 w-5" />
          )}
          <span>Refill ({e.referralCredits})</span>
          <span className="text-[10px] font-semibold opacity-90">{refillSubLabel}</span>
        </Button>

        {/* Speed Boost */}
        <Button
          onClick={handleSpeedBoost}
          disabled={speedBtnDisabled}
          variant="outline"
          className="h-16 flex-col gap-0.5 rounded-2xl border-cyan-400/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-foreground hover:text-cyan-200 relative overflow-hidden transition-all disabled:opacity-50"
        >
          {adLoading === "speed" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5 text-cyan-300" />
          )}
          <span className="text-sm font-bold">
            Boost ({sb.adUsesLeft}/{sb.adUsesMax})
          </span>
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
              You've used all {sb.adUsesMax} of today's 2× Speed boosts.
              Come back tomorrow for a fresh allowance.
            </p>
            <Button
              onClick={() => { SFX.click(); setBoostExhausted(false); }}
              className="btn-gold w-full h-11 font-bold rounded-xl"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
