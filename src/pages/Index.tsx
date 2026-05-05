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
import { ClaimRewardButton } from "@/components/game/ClaimRewardButton";
import { InfoButton } from "@/components/game/InfoButton";
import { AdSlot } from "@/components/game/AdSlot";
import { AuthButtons } from "@/auth/AuthButtons";
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

  useEffect(() => { loadFromStorage(); }, []);
  useEffect(() => { setSfxMuted(muted); }, [muted]);

  useEffect(() => {
    const spawn = window.setInterval(autoSpawnTick, 250);
    const combo = window.setInterval(comboTick, 500);
    return () => { clearInterval(spawn); clearInterval(combo); };
  }, []);

  useEffect(() => {
    const onTouch = () => { unlockAudio(); window.removeEventListener("pointerdown", onTouch); };
    window.addEventListener("pointerdown", onTouch);
    return () => window.removeEventListener("pointerdown", onTouch);
  }, []);

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
    <main className="relative min-h-screen w-full px-3 py-3 pb-24 max-w-[640px] mx-auto flex flex-col gap-3">
      {/* Header — title left, leaderboard + auth right */}
      {phase !== "menu" && (
        <header className="sticky top-0 -mx-3 px-3 pt-3 pb-3 z-40 backdrop-blur-md bg-background/70 animate-fade-in border-b border-gold-700/20">
          <div className="flex items-center justify-between gap-3">
            <h1 className="leading-tight tracking-[0.14em] min-w-0">
              <span className="block text-lg sm:text-xl font-extrabold text-gold drop-shadow-[0_2px_8px_hsl(43_90%_55%/0.35)]">
                GOLD COIN
              </span>
              <span className="block text-xs sm:text-sm font-bold text-gold-200/90">
                MERGE QUEST
              </span>
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <LeaderboardButton />
              <AuthButtons />
            </div>
          </div>
        </header>
      )}

      {/* XP / Level + spawn status — glass container */}
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

      {/* Claim Reward — prominent CTA */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in">
          <ClaimRewardButton />
        </section>
      )}

      {/* Action bar */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in"><ActionBar /></section>
      )}

      {/* Share + Diamonds — single horizontal row */}
      {phase !== "menu" && (
        <section className="z-20 animate-fade-in grid grid-cols-2 gap-2">
          <div className="panel-gold rounded-2xl h-12 flex items-center justify-center">
            <InviteButton />
          </div>
          <div className="panel-gold rounded-2xl h-12 flex items-center justify-center">
            <TokenCounter />
          </div>
        </section>
      )}

      {/* Ad block above missions */}
      {phase !== "menu" && (
        <section className="z-10 animate-fade-in">
          <AdSlot className="bg-secondary/20 border border-gold-700/20" />
        </section>
      )}

      {/* Missions */}
      {phase !== "menu" && (
        <section className="z-10 animate-fade-in"><MissionsPanel /></section>
      )}

      <BannerStack />
      <Tutorial />
      <SellAction />

      {/* Full-width "How to Play" pinned to bottom */}
      {phase !== "menu" && (
        <div className="fixed left-0 right-0 bottom-0 z-30 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="max-w-[640px] mx-auto">
            <InfoButton fullWidth />
          </div>
        </div>
      )}

      {phase === "menu" && <MainMenu />}
    </main>
  );
};

export default Index;
