import { useState } from "react";
import { Info, X, Sparkles, Zap, Repeat, Users, Crown, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SFX } from "@/game/sound";

/**
 * Rules / Info popup. Explains merge mechanics, sell tiers, boosts and
 * referral benefits in one place. Triggered from a small "?" chip in the
 * header so it doesn't crowd the three primary top icons.
 */
export function InfoButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {fullWidth ? (
        <button
          onClick={() => { SFX.click(); setOpen(true); }}
          aria-label="Game rules"
          className="btn-gold w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-extrabold tracking-wide shadow-gold hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <Info className="h-4 w-4" /> How to Play
        </button>
      ) : (
        <button
          onClick={() => { SFX.click(); setOpen(true); }}
          aria-label="Game rules"
          className="panel-gold h-8 px-2.5 rounded-full flex items-center gap-1 text-[11px] font-semibold text-gold-200 hover:shadow-gold transition-shadow"
        >
          <Info className="h-3.5 w-3.5" /> How to Play
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel-gold rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[88vh] flex flex-col shadow-popup animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gold flex items-center gap-2">
                <Info className="h-5 w-5 text-gold-300" /> How to Play
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar flex-1 space-y-3 pr-1 text-sm">
              <Rule icon={<Sparkles className="h-4 w-4 text-gold-300" />} title="Merge to Evolve">
                Drag identical items onto each other to merge them into the next level.
                Three categories — Gold Relics, Blockchain Tech, Treasure Artifacts — each
                with 12 evolution levels.
              </Rule>

              <div className="rounded-2xl bg-secondary/40 border border-gold-700/40 p-3">
                <div className="flex items-center gap-2 font-bold text-gold mb-2">
                  <Crown className="h-4 w-4" /> Sell for Gold Tokens
                </div>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Level 10</span>
                    <span className="font-bold text-emerald-300">10 Tokens</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Level 11</span>
                    <span className="font-bold text-emerald-300">50 Tokens</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Level 12</span>
                    <span className="font-bold text-emerald-300">100 Tokens</span>
                  </li>
                </ul>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Levels 1–9 cannot be sold. Tokens go straight to your Gold Coin wallet.
                </p>
              </div>

              <Rule icon={<Zap className="h-4 w-4 text-cyan-300" />} title="2× Speed Boost">
                Doubles spawn rate for 2 minutes — drops the interval to 1.5s. One free
                use per day, plus up to 3 ad-based uses.
              </Rule>

              <Rule icon={<Repeat className="h-4 w-4 text-gold-300" />} title="Refill the Board">
                Get 2 free ad refills daily. After that, watch a rewarded ad for an
                instant extra refill — always available.
              </Rule>

              <Rule icon={<Users className="h-4 w-4 text-emerald-300" />} title="Invite Friends">
                Each successful referral grants a free Refill Credit (or trade one in for
                a 2× Speed Boost). Credits stack and never expire.
              </Rule>

              <Rule icon={<Gem className="h-4 w-4 text-emerald-300" />} title="Strategy Wins">
                Higher levels need patience and planning — keep cells open, chain combos,
                and time your boosts.
              </Rule>
            </div>

            <Button
              onClick={() => { SFX.click(); setOpen(false); }}
              className="btn-gold mt-4 h-11 font-bold rounded-xl"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Rule({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-gold-700/30 p-3">
      <div className="flex items-center gap-2 font-bold text-gold mb-1">
        {icon} {title}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
