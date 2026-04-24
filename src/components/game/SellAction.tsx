import { Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sellSelected, selectors, useGame } from "@/game/store";
import { SFX } from "@/game/sound";

/**
 * Floating Sell action — appears whenever a sellable tile is selected
 * (currently Level 7 Golden Crown → 1 Gold Coin).
 */
export function SellAction() {
  const sellable = useGame(selectors.selectedSellable);
  const reward = useGame(selectors.selectedSellReward);

  if (!sellable) return null;

  function handleSell() {
    SFX.click();
    sellSelected();
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 animate-banner-in">
      <Button
        onClick={handleSell}
        className="btn-gold h-14 px-6 rounded-full font-extrabold text-base shadow-gold-strong pulse-gold flex items-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        Sell Crown
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/30">
          <Coins className="h-4 w-4" />
          +{reward}
        </span>
      </Button>
    </div>
  );
}
