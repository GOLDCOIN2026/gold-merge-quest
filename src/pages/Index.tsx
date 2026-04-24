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
import { autoSpawnTick, comboTick, loadFromStorage, setMuted, useGame } from "@/game/store";
import { setMuted as setSfxMuted, unlockAudio } from "@/game/sound";

const Index = () => {
  const muted = useGame(s => s.muted);

  // Boot
  useEffect(() => {
    loadFromStorage();
    setSfxMuted(useGame.length === 0 ? false : false); // sync muted from store on next render
  }, []);

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

  return (
    <main className="relative min-h-screen w-full px-3 py-3 max-w-[640px] mx-auto flex flex-col gap-3">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-extrabold text-gold tracking-tight">
            Gold Merge Boss
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
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

      {/* Coins + HUD */}
      <section className="flex items-stretch gap-2">
        <div className="flex-1"><HUD /></div>
        <div className="self-start"><CoinCounter /></div>
      </section>

      {/* Board */}
      <section className="z-10">
        <Board />
      </section>

      {/* Action bar */}
      <section className="z-10"><ActionBar /></section>

      {/* Missions */}
      <section className="z-10 pb-3"><MissionsPanel /></section>

      <BannerStack />
      <Tutorial />
    </main>
  );
};

export default Index;
