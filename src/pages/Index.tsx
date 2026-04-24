import { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Board } from "@/components/game/Board";
import { CoinCounter } from "@/components/game/CoinCounter";
import { HUD } from "@/components/game/HUD";
import { ActionBar } from "@/components/game/ActionBar";
import { MissionsPanel } from "@/components/game/MissionsPanel";
import { BannerStack } from "@/components/game/BannerStack";
import { AchievementsButton } from "@/components/game/AchievementsButton";
import { DailyRewardButton } from "@/components/game/DailyRewardButton";
import { Tutorial } from "@/components/game/Tutorial";
import { MainMenu } from "@/components/game/MainMenu";
import { MenuBar } from "@/components/game/MenuBar";
import { SellAction } from "@/components/game/SellAction";
import {
  autoSpawnTick,
  comboTick,
  loadFromStorage,
  persistNow,
  setMuted,
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
    const spawn = window.setInterval(autoSpawnTick, 500);
    const combo = window.setInterval(comboTick, 500);
    return () => { clearInterval(spawn); clearInterval(combo); };
  }, []);

  // Unlock audio on first interaction
  useEffect(() => {
    const onTouch = () => { unlockAudio(); window.removeEventListener("pointerdown", onTouch); };
    window.addEventListener("pointerdown", onTouch);
    return () => window.removeEventListener("pointerdown", onTouch);
  }, []);

  // Save before unload (back button, app close, navigation away)
  useEffect(() => {
    const onHide = () => persistNow();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistNow();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full px-3 py-3 max-w-[640px] mx-auto flex flex-col gap-3">
      {/* Top bar — only visible in-game */}
      {phase !== "menu" && (
        <header className="flex items-center justify-between gap-2 z-10 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-gold tracking-tight truncate">
              Gold Merge Boss
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <MenuBar />
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

      {/* Coins + HUD */}
      {phase !== "menu" && (
        <section className="flex items-stretch gap-2 animate-fade-in">
          <div className="flex-1"><HUD /></div>
          <div className="self-start"><CoinCounter /></div>
        </section>
      )}

      {/* Board */}
      {phase !== "menu" && (
        <section className="z-10 animate-fade-in">
          <Board />
        </section>
      )}

      {/* Action bar */}
      {phase !== "menu" && (
        <section className="z-10 animate-fade-in"><ActionBar /></section>
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
