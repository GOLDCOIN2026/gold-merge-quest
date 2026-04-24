import { useState } from "react";
import { Play, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startGame } from "@/game/store";
import { closeApp } from "@/game/bridge";
import { SFX } from "@/game/sound";
import logo from "@/assets/gold-coin-logo.png";

/**
 * Polished launch / main menu screen.
 * Displayed before any gameplay — game must NOT auto-start.
 */
export function MainMenu() {
  const [transitioning, setTransitioning] = useState(false);

  function handlePlay() {
    if (transitioning) return;
    SFX.click();
    setTransitioning(true);
    // Brief transition for polish
    window.setTimeout(() => {
      startGame();
      setTransitioning(false);
    }, 350);
  }

  function handleQuit() {
    SFX.click();
    closeApp();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5 animate-fade-in overflow-hidden">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-bg)" }} />
      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 30%, hsl(43 96% 56% / 0.18), transparent 55%), radial-gradient(circle at 20% 80%, hsl(38 92% 50% / 0.12), transparent 50%), radial-gradient(circle at 80% 90%, hsl(280 70% 60% / 0.08), transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-sm panel-gold rounded-3xl p-7 sm:p-8 text-center shadow-popup animate-scale-in">
        {/* Logo */}
        <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-gold blur-2xl opacity-60 pulse-gold" />
          <img
            src={logo}
            alt="Gold Coin logo"
            className="relative h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(255,193,7,0.5)] animate-coin-bounce"
            draggable={false}
          />
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gold mb-1 tracking-tight">
          Play Gold Coin Merge Quest
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Make Free Rewards Every Day
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handlePlay}
            disabled={transitioning}
            className="btn-gold w-full h-14 text-base font-extrabold rounded-2xl pulse-gold"
          >
            {transitioning ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Play className="h-5 w-5 mr-2" fill="currentColor" />
            )}
            Play Game
          </Button>
          <Button
            onClick={handleQuit}
            variant="outline"
            className="w-full h-12 text-sm font-bold rounded-2xl border-gold-700/50 bg-secondary/50 hover:bg-secondary text-foreground hover:text-gold-200"
          >
            <X className="h-4 w-4 mr-2" />
            Quit
          </Button>
        </div>

        <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Powered by Gold Coin
        </div>
      </div>
    </div>
  );
}
