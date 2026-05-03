import { useState } from "react";
import { Coins, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sellSelected, selectors, useGame, type Tile } from "@/game/store";
import { getItem, getCategory } from "@/game/items";
import { SFX } from "@/game/sound";

/**
 * Floating Sell action — appears whenever a sellable tile is selected
 * (Levels 6-10 → Gold Coin Tokens).
 */
export function SellAction() {
  const sellable = useGame(selectors.selectedSellable);
  const reward = useGame(selectors.selectedSellReward);
  const tile = useGame(selectors.selectedTile);
  const [confirm, setConfirm] = useState(false);

  if (!sellable || !tile) return null;

  function handleSell() {
    SFX.sell();
    sellSelected();
    setConfirm(false);
  }

  return (
    <>
      {/* Floating sell button — brief preview of reward */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 animate-banner-in">
        <Button
          onClick={() => { SFX.click(); setConfirm(true); }}
          className="btn-gold h-14 px-5 rounded-full font-extrabold text-base shadow-gold-strong pulse-gold flex items-center gap-2"
        >
          <Crown className="h-5 w-5" />
          Sell {getItem(tile.category, tile.level).name}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/30 ml-1">
            <Coins className="h-4 w-4" />
            +{reward}
          </span>
        </Button>
      </div>

      {/* Confirmation dialog */}
      {confirm && <SellConfirm tile={tile} reward={reward} onConfirm={handleSell} onCancel={() => setConfirm(false)} />}
    </>
  );
}

function SellConfirm({ tile, reward, onConfirm, onCancel }: {
  tile: Tile; reward: number; onConfirm: () => void; onCancel: () => void;
}) {
  const item = getItem(tile.category, tile.level);
  const cat = getCategory(tile.category);
  return (
    <div className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
      <div className="panel-gold rounded-3xl p-6 w-full max-w-xs text-center shadow-popup animate-scale-in">
        <div
          className="mx-auto h-24 w-24 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: `radial-gradient(circle, ${cat.glow}, transparent 70%)` }}
        >
          <img src={item.image} alt={item.name} className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sell {cat.name} L{tile.level}</p>
        <h2 className="text-lg font-extrabold text-gold mb-1">{item.name}</h2>
        <div className="my-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-gold-700/50">
          <Sparkles className="h-4 w-4 text-gold-300" />
          <span className="font-extrabold text-gold tabular-nums">+{reward}</span>
          <span className="text-xs text-muted-foreground">Gold Coin Token{reward === 1 ? "" : "s"}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Tokens are sent to your Gold Coin wallet.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="h-11 font-semibold rounded-xl border-gold-700/50 bg-secondary/50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="btn-gold h-11 font-bold rounded-xl"
          >
            Confirm Sell
          </Button>
        </div>
      </div>
    </div>
  );
}
