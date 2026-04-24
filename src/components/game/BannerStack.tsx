import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

export function BannerStack() {
  const banners = useGame(s => s.banners);
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {banners.map(b => (
        <div
          key={b.id}
          className={cn(
            "panel-gold rounded-2xl px-5 py-2.5 shadow-popup animate-banner-in min-w-[200px] text-center",
            b.variant === "achievement" && "border-gold-400/60",
            b.variant === "level" && "border-cyan-400/60",
            b.variant === "combo" && "border-accent/60",
          )}
        >
          <div className="text-sm font-extrabold text-gold">{b.title}</div>
          {b.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{b.subtitle}</div>}
        </div>
      ))}
    </div>
  );
}
