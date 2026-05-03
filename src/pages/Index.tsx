import { useEffect } from "react";
import { Board } from "@/components/game/Board";
import { CoinCounter, TokenCounter } from "@/components/game/CoinCounter";
import { HUD } from "@/components/game/HUD";
import { ActionBar } from "@/components/game/ActionBar";
import { MissionsPanel } from "@/components/game/MissionsPanel";
import { BannerStack } from "@/components/game/BannerStack";
import { Tutorial } from "@/components/game/Tutorial";
import { MainMenu } from "@/components/game/MainMenu";
import { SellAction } from "@/components/game/SellAction";
import { InviteButton } from "@/components/game/InviteButton";
import { LeaderboardButton } from "@/components/game/LeaderboardButton";
import { ClaimRewardButton } from "@/components/game/ClaimRewardButton";
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

const Index = () => {
  const muted = useGame(s => s.muted);
  const phase = useGame(s => s.phase);

  // Boot — load saved state once. Always boots into the main menu.
  useEffect(() => { loadFromStorage(); }, []);

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
    const onHide = () => persistNow();
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
      {/* ---- Top header (sticky, always above board) ---- */}
      {phase !== "menu" && (
        <header className="sticky top-0 -mx-3 px-3 pt-3 pb-3 z-40 backdrop-blur-md bg-background/70 animate-fade-in border-b border-gold-700/20">
          {/* Two-line premium title */}
          <h1 className="text-center mb-3 leading-tight tracking-[0.18em]">
            <span className="block text-2xl sm:text-3xl font-extrabold text-gold drop-shadow-[0_2px_8px_hsl(43_90%_55%/0.35)]">
              GOLD COIN
            </span>
            <span className="block text-lg sm:text-xl font-bold text-gold-200/90">
              MERGE QUEST
            </span>
          </h1>
          {/* Three primary icons: Share · Score · Diamonds */}
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto items-center">
            <div className="flex justify-center"><InviteButton /></div>
            <div className="flex justify-center"><LeaderboardButton /></div>
            <div className="flex justify-center"><TokenCounter /></div>
          </div>
          {/* Subtle "How to Play" chip */}
          <div className="flex justify-center mt-2">
            <InfoButton />
          </div>
        </header>
      )}

      {/* Score (coins) — single balance row beneath header */}
      {phase !== "menu" && (
        <section className="flex items-center justify-center z-20 animate-fade-in">
          <CoinCounter />
        </section>
      )}

      {/* XP + spawn HUD */}
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

      {/* Claim Reward — prominent CTA above the action bar */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in">
          <ClaimRewardButton />
        </section>
      )}

      {/* Action bar */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in"><ActionBar /></section>
      )}

      {/* Missions */}
      {phase !== "menu" && (
        <section className="z-10 pb-20 animate-fade-in"><MissionsPanel /></section>
      )}

      <BannerStack />
      <Tutorial />
      <SellAction />

      {/* Main menu — modal-style, covers everything */}
      {phase === "menu" && <MainMenu />}
    </main>
  );
};

export default Index;
