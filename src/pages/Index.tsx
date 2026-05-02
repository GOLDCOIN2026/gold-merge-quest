import { useEffect } from "react";
import { Board } from "@/components/game/Board";
import { TokenCounter } from "@/components/game/CoinCounter";
import { HUD } from "@/components/game/HUD";
import { ActionBar } from "@/components/game/ActionBar";
import { MissionsPanel } from "@/components/game/MissionsPanel";
import { BannerStack } from "@/components/game/BannerStack";
import { Tutorial } from "@/components/game/Tutorial";
import { MainMenu } from "@/components/game/MainMenu";
import { SellAction } from "@/components/game/SellAction";
import { InviteButton } from "@/components/game/InviteButton";
import { LeaderboardButton } from "@/components/game/LeaderboardButton";
import { InfoButton } from "@/components/game/InfoButton";
import {
  autoSpawnTick,
  comboTick,
  loadFromStorage,
  persistNow,
  syncReferralCredits,
  useGame,
} from "@/game/store";
import { setMuted as setSfxMuted, unlockAudio } from "@/game/sound";
import { initTelegram } from "@/lib/telegram";
import { initAuth } from "@/lib/auth";
import { submitScore, trackTokens, flushScore } from "@/lib/leaderboard";

const Index = () => {
  const muted = useGame(s => s.muted);
  const phase = useGame(s => s.phase);

  const tokens = useGame(s => s.tokens);
  const level = useGame(s => s.level);

  // Boot — load saved state, init Telegram + Firebase Auth (run once).
  useEffect(() => {
    loadFromStorage();
    initTelegram();
    initAuth();
  }, []);

  // Push token totals to the global leaderboard (debounced)
  useEffect(() => {
    trackTokens(tokens);
    submitScore(tokens, level);
  }, [tokens, level]);

  // Sync muted state to SFX engine
  useEffect(() => { setSfxMuted(muted); }, [muted]);

  // Game loop ticks
  useEffect(() => {
    const spawn = window.setInterval(autoSpawnTick, 250);
    const combo = window.setInterval(comboTick, 500);
    return () => { clearInterval(spawn); clearInterval(combo); };
  }, []);

  // Unlock audio on first interaction
  useEffect(() => {
    const onTouch = () => { unlockAudio(); window.removeEventListener("pointerdown", onTouch); };
    window.addEventListener("pointerdown", onTouch);
    return () => window.removeEventListener("pointerdown", onTouch);
  }, []);

  // Save before unload + sync referrals on resume
  useEffect(() => {
    const onHide = () => { persistNow(); flushScore(); };
    const onShow = () => syncReferralCredits();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistNow();
      else onShow();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full px-3 py-3 max-w-[640px] mx-auto flex flex-col gap-3">
      {/* ---- Header — title only ---- */}
      {phase !== "menu" && (
        <header className="sticky top-0 -mx-3 px-3 pt-3 pb-3 z-40 backdrop-blur-md bg-background/70 animate-fade-in border-b border-gold-700/20">
          <h1 className="text-center leading-tight tracking-[0.18em]">
            <span className="block text-2xl sm:text-3xl font-extrabold text-gold drop-shadow-[0_2px_12px_hsl(43_90%_55%/0.45)]">
              GOLD COIN
            </span>
            <span className="block text-lg sm:text-xl font-bold text-gold-200/90">
              MERGE QUEST
            </span>
          </h1>
        </header>
      )}

      {/* XP + spawn status */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in">
          <HUD />
        </section>
      )}

      {/* Board */}
      {phase !== "menu" && (
        <section className="z-0 animate-fade-in">
          <Board />
        </section>
      )}

      {/* Sell button — appears under board when a sellable tile is selected */}
      {phase !== "menu" && (
        <section className="z-30 animate-fade-in"><SellAction /></section>
      )}

      {/* Gameplay row — Refill · 2× Speed */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in"><ActionBar /></section>
      )}

      {/* Utility row — Share · Leaderboard · Diamonds */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in">
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="flex justify-center"><InviteButton /></div>
            <div className="flex justify-center"><LeaderboardButton /></div>
            <div className="flex justify-center"><TokenCounter /></div>
          </div>
        </section>
      )}

      {/* Missions */}
      {phase !== "menu" && (
        <section className="z-10 animate-fade-in"><MissionsPanel /></section>
      )}

      {/* Full-width How to Play */}
      {phase !== "menu" && (
        <section className="z-20 pb-6 animate-fade-in">
          <InfoButton fullWidth />
        </section>
      )}

      <BannerStack />
      <Tutorial />

      {/* Main menu — modal-style, covers everything */}
      {phase === "menu" && <MainMenu />}
    </main>
  );
};

export default Index;
