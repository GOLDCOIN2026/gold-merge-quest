import { useEffect, useRef } from "react";
import { Coins } from "lucide-react";
import { useGame } from "@/game/store";

/** Animated, smoothly tweening coin counter. */
export function CoinCounter() {
  const target = useGame(s => s.coins);
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

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full panel-gold shadow-gold animate-coin-bounce" key={target}>
      <Coins className="h-5 w-5 text-gold-300 drop-shadow" />
      <span ref={ref} className="font-bold text-gold tabular-nums text-base sm:text-lg">0</span>
    </div>
  );
}
