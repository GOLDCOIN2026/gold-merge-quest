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
import {
  autoSpawnTick,
  comboTick,
  loadFromStorage,
  persistNow,
  setMuted,
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
      {/* ---- Top bar (sticky, always above board) ---- */}
      {phase !== "menu" && (
        <header className="sticky top-0 -mx-3 px-3 pt-3 pb-2 z-40 backdrop-blur-md bg-background/70 animate-fade-in border-b border-gold-700/20">
          {/* Title centered */}
          <h1 className="text-base sm:text-lg font-extrabold text-gold tracking-tight text-center mb-2 truncate">
            GOLD COIN MERGE QUEST
          </h1>
          {/* Action icons — exactly 4 per row */}
          <div className="grid grid-cols-4 gap-1.5 justify-items-center">
            <MenuBar />
            <InviteButton />
            <LeaderboardButton />
            <DailyRewardButton />
            <AchievementsButton />
            <button
              onClick={() => setMuted(!muted)}
              className="panel-gold h-10 w-10 rounded-full flex items-center justify-center"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-gold-300" />}
            </button>
          </div>
        </header>
      )}

      {/* Balance (left) + Diamonds (right) — only these 2 */}
      {phase !== "menu" && (
        <section className="flex items-center justify-between gap-2 z-20 animate-fade-in">
          <CoinCounter />
          <TokenCounter />
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
