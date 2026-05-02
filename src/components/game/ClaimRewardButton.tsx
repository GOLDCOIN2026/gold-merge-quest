import { useState } from "react";
import { Gem, ExternalLink, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { GAME_CONFIG } from "@/game/config";
import { openExternal } from "@/lib/telegram";
import { SFX } from "@/game/sound";

/**
 * Prominent Claim Reward button — shows the player's current Gold Token balance
 * and opens a premium popup that links out to the full Gold Coin app.
 */
export function ClaimRewardButton() {
  const tokens = useGame(s => s.tokens);
  const phase = useGame(s => s.phase);
  const [open, setOpen] = useState(false);

  if (phase === "menu") return null;

  function handleProceed() {
    SFX.click();
    setOpen(false);
    openExternal(GAME_CONFIG.CLAIM_URL);
  }

  return (
    <>
      <button
        onClick={() => { SFX.click(); setOpen(true); }}
        className="btn-gold pulse-gold w-full h-12 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-gold-strong"
        aria-label="Claim Gold Token reward"
      >
        <Gem className="h-5 w-5" />
        <span>Claim Reward</span>
        <span className="ml-1 px-2.5 py-0.5 rounded-full bg-background/30 text-sm tabular-nums">
          {tokens.toLocaleString()} 🪙
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel-gold rounded-3xl p-6 w-full max-w-sm shadow-popup animate-scale-in relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, hsl(43 96% 56% / 0.35), transparent 60%)",
              }}
            />

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold-strong mb-3 pulse-gold">
                <Gem className="h-10 w-10 text-primary-foreground" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Your Gold Token Balance
              </p>
              <div className="my-2 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-gold tabular-nums">
                  {tokens.toLocaleString()}
                </span>
                <span className="text-base font-bold text-gold-300">🪙</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Earned from selling high-tier merged items
              </p>
            </div>

            <div className="my-5 panel-gold rounded-2xl p-4 text-center border border-gold-500/30">
              <Sparkles className="h-5 w-5 text-gold-300 mx-auto mb-1" />
              <p className="text-sm font-semibold text-foreground leading-snug">
                Get the Full Version of GOLD COIN to claim your rewards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => { SFX.click(); setOpen(false); }}
                variant="outline"
                className="h-12 font-bold rounded-xl border-gold-700/50 bg-secondary/50"
              >
                Return
              </Button>
              <Button
                onClick={handleProceed}
                className="btn-gold h-12 font-extrabold rounded-xl"
              >
                Proceed <ExternalLink className="h-4 w-4 ml-1.5" />
              </Button>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Opens goldcoinweb3.com in a new window.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
