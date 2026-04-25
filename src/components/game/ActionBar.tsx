import { useState } from "react";
import { Zap, Sparkles, Repeat, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGame,
  activateSpeedBoost,
  consumeFreeSpeedBoost,
  consumeAdRefill,
  consumeReferralRefill,
  getRefillEligibility,
  selectors,
} from "@/game/store";
import { showRewardedAd } from "@/game/bridge";
import { SFX } from "@/game/sound";

/**
 * Bottom action bar — Refill + 2× Speed Boost.
 * The manual Generate button has been removed; items now spawn automatically.
 */
export function ActionBar() {
  const phase = useGame(s => s.phase);
  const dailyFree = useGame(s => s.dailyFreeUses);
  const refillsUsedToday = useGame(s => s.refillsUsedToday);
  const referralCredits = useGame(s => s.referralRefillCredits);
  const speedActive = useGame(selectors.speedActive);
  const board = useGame(s => s.board);
  const [adLoading, setAdLoading] = useState<"speed" | "refill" | null>(null);
  const [refillNoCredits, setRefillNoCredits] = useState(false);

  const disabled = phase !== "playing";
  const empty = board.filter(c => c == null).length;

  const e = getRefillEligibility();

  // ----- Speed Boost -----
  async function handleSpeedBoost() {
    if (disabled || speedActive || adLoading) return;
    SFX.click();
    if (dailyFree.speedBoost) {
      consumeFreeSpeedBoost();
      activateSpeedBoost();
      return;
    }
    setAdLoading("speed");
    const ok = await showRewardedAd();
    setAdLoading(null);
    if (!ok) { SFX.error(); return; }
    activateSpeedBoost();
  }

  // ----- Refill -----
  async function handleRefill() {
    if (disabled || adLoading) return;
    if (empty === 0) { SFX.error(); return; }
    SFX.click();

    // Tier 1: Ad-based refills (first DAILY_AD_REFILLS per day)
    if (e.adRefillsLeftToday > 0) {
      setAdLoading("refill");
      const ok = await showRewardedAd();
      setAdLoading(null);
      if (!ok) { SFX.error(); return; }
      consumeAdRefill();
      return;
    }

    // Tier 2: Referral credits
    if (e.referralCredits > 0) {
      consumeReferralRefill();
      return;
    }

    // Tier 3: Out of options — prompt to invite friends.
    setRefillNoCredits(true);
  }

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
          <span className="text-[10px] font-semibold opacity-90">
            {empty === 0 ? "Board full" :
              e.adRefillsLeftToday > 0 ? `Watch ad · ${e.adRefillsLeftToday}/${2} left` :
              e.referralCredits > 0 ? `Use credit · ${e.referralCredits} avail.` :
              "Invite friends"}
          </span>
        </Button>

        {/* Speed Boost */}
        <Button
          onClick={handleSpeedBoost}
          disabled={disabled || speedActive || adLoading !== null}
          variant="outline"
          className="h-16 flex-col gap-0.5 rounded-2xl border-cyan-400/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-foreground hover:text-cyan-200 relative overflow-hidden"
        >
          {dailyFree.speedBoost && !speedActive && (
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
          <span className="text-[10px] font-semibold opacity-90">
            {speedActive ? "Active" :
              dailyFree.speedBoost ? "Free today" :
              "Watch ad · 2 min"}
          </span>
        </Button>
      </div>

      {/* Refill exhausted modal */}
      {refillNoCredits && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in"
          onClick={() => setRefillNoCredits(false)}
        >
          <div
            className="panel-gold rounded-3xl p-6 w-full max-w-xs text-center shadow-popup animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold mb-3">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-extrabold text-gold mb-1">Out of Refills</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Invite your friends to earn free refills. Each successful referral grants 1 permanent refill credit.
            </p>
            <div className="text-[11px] text-muted-foreground mb-4 panel-gold rounded-xl p-2">
              You have <span className="font-bold text-gold">{referralCredits}</span> referral credit{referralCredits === 1 ? "" : "s"}.
              Daily ad refills used: <span className="font-bold text-gold">{refillsUsedToday}/2</span>.
            </div>
            <Button
              onClick={() => { SFX.click(); setRefillNoCredits(false); }}
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
