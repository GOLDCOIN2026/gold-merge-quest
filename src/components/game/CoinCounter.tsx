import { useEffect, useRef } from "react";
import { Coins, Gem } from "lucide-react";
import { useGame } from "@/game/store";

function useTween(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const displayed = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const animate = () => {
      const diff = target - displayed.current;
      if (Math.abs(diff) < 0.5) {
        displayed.current = target;
        if (ref.current) ref.current.textContent = Math.round(target).toLocaleString();
        rafRef.current = null;
        return;
      }
      displayed.current += diff * 0.18;
      if (ref.current) ref.current.textContent = Math.round(displayed.current).toLocaleString();
      rafRef.current = requestAnimationFrame(animate);
    };
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [target]);
  return ref;
}

/** Animated, smoothly tweening Coin counter (in-game economy). */
export function CoinCounter() {
  const target = useGame(s => s.coins);
  const ref = useTween(target);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full panel-gold shadow-gold animate-coin-bounce" key={target}>
      <Coins className="h-5 w-5 text-gold-300 drop-shadow" />
      <span ref={ref} className="font-bold text-gold tabular-nums text-base sm:text-lg">0</span>
    </div>
  );
}

/** Token counter — Gold Coin Tokens earned via selling high-tier items. */
export function TokenCounter() {
  const target = useGame(s => s.tokens);
  const ref = useTween(target);
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full panel-gold animate-coin-bounce"
      key={`tok-${target}`}
      style={{
        boxShadow: "0 8px 24px -4px hsl(150 75% 50% / 0.4), 0 0 0 1px hsl(150 75% 50% / 0.4)",
      }}
    >
      <Gem className="h-5 w-5 text-emerald-300 drop-shadow" />
      <span ref={ref} className="font-bold text-emerald-200 tabular-nums text-base sm:text-lg">0</span>
    </div>
  );
}
